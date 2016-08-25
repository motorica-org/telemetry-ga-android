package com.telemetry_ga_android;

import android.net.Uri;
import android.util.Log;
import android.content.Context;

import com.facebook.react.bridge.*;

import com.google.gson.JsonObject;

import org.json.JSONException;
import org.json.JSONObject;

import org.matrix.androidsdk.HomeserverConnectionConfig;
import org.matrix.androidsdk.MXDataHandler;
import org.matrix.androidsdk.MXSession;
import org.matrix.androidsdk.data.MXMemoryStore;
import org.matrix.androidsdk.rest.callback.ApiCallback;
import org.matrix.androidsdk.rest.client.RoomsRestClient;
import org.matrix.androidsdk.rest.model.Event;
import org.matrix.androidsdk.rest.model.MatrixError;
import org.matrix.androidsdk.rest.model.RoomResponse;
import org.matrix.androidsdk.rest.model.login.Credentials;


class MatrixSimpleClient {

    private final String TAG = this.getClass().getCanonicalName();

    private MXSession mxSession;

    public MXSession getMxSession() {
        return mxSession;
    }

    public MatrixSimpleClient(Context context, JSONObject credentials, Uri hs) throws JSONException {
        Credentials mCredentials = Credentials.fromJson(credentials);

        HomeserverConnectionConfig hsConfig = new HomeserverConnectionConfig(hs, mCredentials);

        MXDataHandler mxDataHandler = new MXDataHandler(new MXMemoryStore(), mCredentials, new MXDataHandler.InvalidTokenListener() {
            @Override
            public void onTokenCorrupted() {
                Log.e(TAG, "onTokenCorrupted: ");
            }
        });

        this.mxSession = new MXSession(hsConfig, mxDataHandler, context);
    }

    public static MatrixSimpleClient initFromContext(Context context) throws JSONException {
        return new MatrixSimpleClient(context, new JSONObject(context.getString(R.string.matrix_token)), Uri.parse(context.getString(R.string.matrix_server)));
    }
}

class MatrixRoomClient {

    private final String TAG = this.getClass().getCanonicalName();

    RoomsRestClient roomClient;
    String room;

    public MatrixRoomClient(MatrixSimpleClient matrix, String room) {
        this.roomClient = matrix.getMxSession().getRoomsApiClient();
        this.room = room;

        this.roomClient.initialSync(this.room, new ApiCallback<RoomResponse>() {
            @Override
            public void onSuccess(RoomResponse roomResponse) {

            }

            @Override
            public void onNetworkError(Exception e) {

            }

            @Override
            public void onMatrixError(MatrixError matrixError) {
                Log.e(TAG, "onMatrixError: " + matrixError.mErrorBodyAsString);
            }

            @Override
            public void onUnexpectedError(Exception e) {

            }
        });
    }

    public void sendMessage(String type, String body) {
        JsonObject message = new JsonObject();
        message.addProperty("msgtype", type);
        message.addProperty("body", body);

        this.roomClient.sendEventToRoom(this.room, "m.room.message", message, new ApiCallback<Event>() {
            @Override
            public void onSuccess(Event event) {
                Log.i(TAG, "onSuccess: " + event);
            }

            @Override
            public void onNetworkError(Exception e) {
                Log.e(TAG, "onNetworkError: ", e);
            }

            @Override
            public void onMatrixError(MatrixError matrixError) {
                Log.e(TAG, "onMatrixError: " + matrixError.mErrorBodyAsString);
            }

            @Override
            public void onUnexpectedError(Exception e) {
                Log.e(TAG, "onUnexpectedError: ", e);
            }
        });
    }
}

class MatrixReactWrapper extends ReactContextBaseJavaModule {

    private final String TAG = this.getClass().getSimpleName();

    private Context context;
    private ReactContext reactContext;
    private MatrixRoomClient roomClient;

    @Override
    public String getName() {
        return this.getClass().getSimpleName();
    }

    public MatrixReactWrapper(ReactApplicationContext reactContext) {
        super(reactContext);
        this.context = reactContext;
        this.reactContext = reactContext;

        try {
            MatrixSimpleClient client = MatrixSimpleClient.initFromContext(this.context);
            this.roomClient = new MatrixRoomClient(client, this.context.getString(R.string.matrix_room));
        }
        catch (JSONException e) {
            Log.e(TAG, "MatrixReactWrapper: Failed to initialize MatrixSimpleClient", e);
        }
    }

    @ReactMethod
    public void sendMessage(String type, String body) {
        this.roomClient.sendMessage(type, body);
    }
}
