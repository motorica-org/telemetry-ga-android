package com.telemetry_ga_android;

import android.content.Context;
import android.net.Uri;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableNativeMap;

import org.json.JSONException;
import org.json.JSONObject;
import org.matrix.androidsdk.HomeserverConnectionConfig;
import org.matrix.androidsdk.MXDataHandler;
import org.matrix.androidsdk.MXSession;
import org.matrix.androidsdk.data.store.MXFileStore;
import org.matrix.androidsdk.rest.callback.ApiCallback;
import org.matrix.androidsdk.rest.client.LoginRestClient;
import org.matrix.androidsdk.rest.client.RoomsRestClient;
import org.matrix.androidsdk.rest.model.Event;
import org.matrix.androidsdk.rest.model.MatrixError;
import org.matrix.androidsdk.rest.model.RoomResponse;
import org.matrix.androidsdk.rest.model.login.Credentials;

import com.telemetry_ga_android.Messages.MotoricaMechanicalMessage;


class MatrixReactWrapper extends ReactContextBaseJavaModule {

    private final String TAG = this.getClass().getSimpleName();

    private Context context;
    private ReactContext reactContext;

    private MXSession mxSession;
    private RoomsRestClient roomClient;

    private String roomId;

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
        this.roomId = roomId;
        this.roomClient = this.mxSession.getRoomsApiClient();

        this.roomClient.initialSync(this.roomId, new ApiCallback<RoomResponse>() {
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

    private void sendMessage(String type, ReadableNativeMap body, final Promise promise) {
        MotoricaMechanicalMessage message = new MotoricaMechanicalMessage();

        message.msgtype = type;
        message.body = body.getString("body");
        message.timestamp = body.getDouble("timestamp");
        message.power = body.getInt("power");

        Log.d(TAG, "sendMessage: " + message.toString());

        final Event event = new Event(message, this.mxSession.getCredentials().userId, this.roomId);
        this.mxSession.getDataHandler().getStore().storeLiveRoomEvent(event);

        // Also see `org.matrix.androidsdk.data.Room.sendEvent()` (45fe7f983fddaec2071f0dd94dfe93cda35b8490)
        if (!event.isUndeliverable()) {
            event.mSentState = Event.SentState.SENDING;
            this.mxSession.getDataHandler().getDataRetriever().getRoomsRestClient().sendEventToRoom(event.originServerTs + "", this.roomId, event.getType(), event.getContent().getAsJsonObject(), new ApiCallback<Event>() {
                @Override
                public void onSuccess(Event serverResponseEvent) {
                    // remove the tmp event
                    mxSession.getDataHandler().getStore().deleteEvent(event);

                    // update the event with the server response
                    event.mSentState = Event.SentState.SENT;
                    event.eventId = serverResponseEvent.eventId;
                    event.originServerTs = System.currentTimeMillis();

                    // the message echo is not yet echoed
                    if (!mxSession.getDataHandler().getStore().doesEventExist(serverResponseEvent.eventId, roomId)) {
                        mxSession.getDataHandler().getStore().storeLiveRoomEvent(event);
                    }

                    mxSession.getDataHandler().getStore().commit();
                    mxSession.getDataHandler().onSentEvent(event);
                }

                @Override
                public void onNetworkError(Exception e) {
                    event.mSentState = Event.SentState.UNDELIVERABLE;
                    event.unsentException = e;
                }

                @Override
                public void onMatrixError(MatrixError e) {
                    event.mSentState = Event.SentState.UNDELIVERABLE;
                    event.unsentMatrixError = e;
                }

                @Override
                public void onUnexpectedError(Exception e) {
                    event.mSentState = Event.SentState.UNDELIVERABLE;
                    event.unsentException = e;
                }
            });
        }

        // We resolve regardless of what happens in callback because storing the event in local storage cannot fail [citation needed], and we can resend it afterwards.
        promise.resolve(null);
    }

    @ReactMethod
    public void sendMessage(String type, ReadableMap body, Promise promise) {
        this.sendMessage(type, (ReadableNativeMap) body, promise);
    }
}
