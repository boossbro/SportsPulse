package com.sportspulse.app; 
import android.os.Bundle; import 
com.getcapacitor.BridgeActivity; 
public class MainActivity extends 
BridgeActivity {
    @Override protected void 
    onCreate(Bundle 
    savedInstanceState) {
        super.onCreate(savedInstanceState);
    }
    @Override public void 
    onBackPressed() {
        if (getBridge() != null 
        &&
            getBridge().getWebView() 
            != null &&
            getBridge().getWebView().canGoBack()) 
            { 
            getBridge().getWebView().goBack();
        } else {
            finishAffinity(); // 
            closes the app 
            completely
        }
    }
}
