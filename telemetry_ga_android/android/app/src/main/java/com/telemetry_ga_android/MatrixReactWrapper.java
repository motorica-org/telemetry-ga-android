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
import com.google.gson.Gson;
import com.google.gson.JsonObject;

import org.json.JSONException;
import org.json.JSONObject;
import org.matrix.androidsdk.HomeserverConnectionConfig;
import org.matrix.androidsdk.MXDataHandler;
import org.matrix.androidsdk.MXSession;
import org.matrix.androidsdk.data.store.MXMemoryStore;
import org.matrix.androidsdk.rest.callback.ApiCallback;
import org.matrix.androidsdk.rest.client.LoginRestClient;
import org.matrix.androidsdk.rest.client.RoomsRestClient;
import org.matrix.androidsdk.rest.model.Event;
import org.matrix.androidsdk.rest.model.MatrixError;
import org.matrix.androidsdk.rest.model.RoomResponse;
import org.matrix.androidsdk.rest.model.login.Credentials;

import java.util.HashMap;
import java.util.Random;


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

        MXDataHandler mxDataHandler = new MXDataHandler(new MXMemoryStore(), credentials, new MXDataHandler.InvalidTokenListener() {
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
        HashMap _body = new HashMap(body.toHashMap());
        _body.put("msgtype", type);

        JsonObject content = new Gson().toJsonTree(_body).getAsJsonObject();

        Log.d(TAG, "sendMessage: " + content);

        Random r = new Random();
        String txnid = "";
        for (int i = 0; i <= 10; i++) {
            txnid += (char) (r.nextInt(26) + 'a');
        }
        this.roomClient.sendEventToRoom(txnid, this.roomId, "m.room.message", content, new ApiCallback<Event>() {
            @Override
            public void onSuccess(Event event) {
                promise.resolve(event.eventId);
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
    public void sendMessage(String type, ReadableMap body, Promise promise) {
        this.sendMessage(type, (ReadableNativeMap) body, promise);
    }
}
