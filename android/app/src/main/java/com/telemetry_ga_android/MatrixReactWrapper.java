package com.telemetry_ga_android;

import android.content.Context;
import android.net.Uri;
import android.os.SystemClock;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

import org.json.JSONException;
import org.json.JSONObject;
import org.matrix.androidsdk.HomeserverConnectionConfig;
import org.matrix.androidsdk.MXDataHandler;
import org.matrix.androidsdk.MXSession;
import org.matrix.androidsdk.data.Room;
import org.matrix.androidsdk.data.store.MXFileStore;
import org.matrix.androidsdk.rest.callback.ApiCallback;
import org.matrix.androidsdk.rest.client.LoginRestClient;
import org.matrix.androidsdk.rest.client.RoomsRestClient;
import org.matrix.androidsdk.rest.model.Event;
import org.matrix.androidsdk.rest.model.MatrixError;
import org.matrix.androidsdk.rest.model.RoomResponse;
import org.matrix.androidsdk.rest.model.login.Credentials;

import java.util.ArrayDeque;

import com.telemetry_ga_android.Messages.MotoricaMechanicalMessage;


class MatrixHelper {

    private final static String TAG = "MatrixHelper";

    public static void resendAll(MXSession session, String roomId) {
        ArrayDeque<Event> resendingEventsList = new ArrayDeque<>(session.getDataHandler().getStore().getUndeliverableEvents(roomId));
        Log.d(TAG, String.format("resendAll: there are %d stored undeliverable events", resendingEventsList.size())); // does not include events already in UnsentEventsManager

        while (!resendingEventsList.isEmpty()) {
            Event event = resendingEventsList.pop();

            resend(session, event);
        }
    }

    public static void resend(final MXSession session, final Event event) {
        Log.d(TAG, "resend: " + event);
        event.mSentState = Event.SentState.UNSENT;

        // It would seem that send() does this, but, empirically, not.
        // TODO: a thorough investigation with a debugger
        event.originServerTs = System.currentTimeMillis();
        session.getDataHandler().deleteRoomEvent(event);

        send(session, event);
    }

    public static void send(final MXSession session, final Event event) {
        // TODO: perhaps we can do somewhat less explicit commits here
        Log.d(TAG, "send: " + event.getContent().toString());

        session.getDataHandler().getStore().storeLiveRoomEvent(event);
        session.getDataHandler().getStore().commit();

        // Also see `org.matrix.androidsdk.data.Room.sendEvent()` (45fe7f983fddaec2071f0dd94dfe93cda35b8490)
        if (!event.isUndeliverable()) {
            event.mSentState = Event.SentState.SENDING;
            session.getDataHandler().getDataRetriever().getRoomsRestClient().sendEventToRoom(event.originServerTs + "", event.roomId, event.getType(), event.getContent().getAsJsonObject(), new ApiCallback<Event>() {
                @Override
                public void onSuccess(Event serverResponseEvent) {
                    // remove the tmp event
                    session.getDataHandler().getStore().deleteEvent(event);

                    // update the event with the server response
                    event.mSentState = Event.SentState.SENT;
                    event.eventId = serverResponseEvent.eventId;
                    event.originServerTs = System.currentTimeMillis();

                    // the message echo is not yet echoed
                    if (!session.getDataHandler().getStore().doesEventExist(serverResponseEvent.eventId, event.roomId)) {
                        session.getDataHandler().getStore().storeLiveRoomEvent(event);
                    }
                    session.getDataHandler().onSentEvent(event);
                    session.getDataHandler().getStore().commit();
                }

                @Override
                public void onNetworkError(Exception e) {
                    event.mSentState = Event.SentState.UNDELIVERABLE;
                    event.unsentException = e;
                    session.getDataHandler().getStore().commit();
                }

                @Override
                public void onMatrixError(MatrixError e) {
                    event.mSentState = Event.SentState.UNDELIVERABLE;
                    event.unsentMatrixError = e;
                    session.getDataHandler().getStore().commit();
                }

                @Override
                public void onUnexpectedError(Exception e) {
                    event.mSentState = Event.SentState.UNDELIVERABLE;
                    event.unsentException = e;
                    session.getDataHandler().getStore().commit();
                }
            });
        }
    }
}


class MatrixReactWrapper extends ReactContextBaseJavaModule {

    private final String TAG = this.getClass().getSimpleName();

    private Context context;
    private ReactContext reactContext;

    private MXSession mxSession;
    private RoomsRestClient roomClient;

    private Room room;

    @Override
    public String getName() {
        return this.getClass().getSimpleName();
    }

    public MatrixReactWrapper(ReactApplicationContext reactContext) {
        super(reactContext);
        this.context = reactContext;
        this.reactContext = reactContext;
    }

    private void passwordLogin(Uri hs, String user, String password, final Promise promise) {
        new LoginRestClient(new HomeserverConnectionConfig(hs)).loginWithPassword(user, password, new ApiCallback<Credentials>() {
            @Override
            public void onSuccess(Credentials credentials) {
                try {
                    promise.resolve(credentials.toJson().toString());
                }
                catch (JSONException e) {
                    promise.reject(e);
                }
            }

            @Override
            public void onNetworkError(Exception e) {
                promise.reject(e);
            }

            @Override
            public void onMatrixError(MatrixError matrixError) {
                promise.reject(matrixError.mErrorBodyAsString);
            }

            @Override
            public void onUnexpectedError(Exception e) {
                promise.reject(e);
            }
        });
    }

    @ReactMethod
    public void passwordLogin(String hs, String user, String password, final Promise promise) {
        this.passwordLogin(Uri.parse(hs), user, password, promise);
    }

    private void initClient(Uri hs, Credentials credentials, final Promise promise) {
        HomeserverConnectionConfig hsConfig = new HomeserverConnectionConfig(hs, credentials);

        MXDataHandler mxDataHandler = new MXDataHandler(new MXFileStore(hsConfig, context), credentials, new MXDataHandler.InvalidTokenListener() {
            @Override
            public void onTokenCorrupted() {
                promise.reject("TokenCorrupted");
            }
        });

        this.mxSession = new MXSession(hsConfig, mxDataHandler, context);

        this.mxSession.getDataHandler().getStore().open();

        promise.resolve(null);
    }

    @ReactMethod
    public void initClient(String hs, String credentials, final Promise promise) {
        Credentials mCredentials;

        try {
            mCredentials = Credentials.fromJson(new JSONObject(credentials));
        }
        catch (JSONException e) {
            promise.reject(e);
            return;
        }

        this.initClient(Uri.parse(hs), mCredentials, promise);
    }

    @ReactMethod
    public void initRoomClient(String roomId, final Promise promise) {
        this.roomClient = this.mxSession.getRoomsApiClient();

        // FIXME: a manual spinlock isn't good.
        while (!this.mxSession.getDataHandler().getStore().isReady()) {
            SystemClock.sleep(1000);
            Log.w(TAG, "initRoomClient: Spinlock: Store not ready");
        }

        this.room = this.mxSession.getDataHandler().getRoom(roomId);

        this.roomClient.initialSync(this.room.getRoomId(), new ApiCallback<RoomResponse>() {
            @Override
            public void onSuccess(RoomResponse roomResponse) {
                promise.resolve(null);
            }

            @Override
            public void onNetworkError(Exception e) {
                promise.reject(e);
            }

            @Override
            public void onMatrixError(MatrixError matrixError) {
                promise.reject(matrixError.mErrorBodyAsString);
            }

            @Override
            public void onUnexpectedError(Exception e) {
                promise.reject(e);
            }
        });

    }

    private void sendEvent(final Event event, final Promise promise) {
        // These methods cannot fail (if the message cannot be sent, it goes to local storage - which can't fail [citation needed]).
        // Therefore, no exception handling or the like here.
        MatrixHelper.send(this.mxSession, event);
        MatrixHelper.resendAll(mxSession, event.roomId); // FIXME: would probably be better off hooked to NetworkListener

        promise.resolve(null);
    }

    @ReactMethod
    public void sendMessage(String type, ReadableMap body, Promise promise) {
        MotoricaMechanicalMessage message = new MotoricaMechanicalMessage();

        message.msgtype = type;
        message.body = body.getString("body");
        message.timestamp = body.getDouble("timestamp");
        message.power = body.getInt("power");

        final Event event = new Event(message, this.mxSession.getCredentials().userId, this.room.getRoomId());

        this.sendEvent(event, promise);
    }
}
