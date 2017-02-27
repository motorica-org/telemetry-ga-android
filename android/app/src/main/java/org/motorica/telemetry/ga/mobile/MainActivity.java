package org.motorica.telemetry.ga.mobile;

import android.view.View;

import com.facebook.react.ReactActivity;

public class MainActivity extends ReactActivity {

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "telemetry_ga_android";
    }

    @Override
    protected void onStart() {
	    getWindow().getDecorView().setSystemUiVisibility(
			      View.SYSTEM_UI_FLAG_LAYOUT_STABLE
			    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
			    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
			    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION // hide navigation bar
			    | View.SYSTEM_UI_FLAG_FULLSCREEN // hide status bar
			    | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
	    super.onStart();
    }
}
