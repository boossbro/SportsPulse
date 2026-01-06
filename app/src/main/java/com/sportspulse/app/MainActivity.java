package com.sportspulse.app; 
import android.os.Bundle; import 
android.webkit.WebSettings; 
import android.webkit.WebView; 
import 
androidx.appcompat.app.AppCompatActivity; 
public class MainActivity extends 
AppCompatActivity {
    @Override protected void 
    onCreate(Bundle 
    savedInstanceState) {
        super.onCreate(savedInstanceState); 
        setContentView(R.layout.activity_main); 
        WebView webView = 
        findViewById(R.id.webview); 
        WebSettings settings = 
        webView.getSettings(); 
        settings.setJavaScriptEnabled(true); 
        settings.setDomStorageEnabled(true); 
        settings.setDatabaseEnabled(true); 
        settings.setCacheMode(WebSettings.LOAD_DEFAULT); 
        settings.setAllowFileAccess(false); 
        settings.setAllowContentAccess(false); 
        settings.setMediaPlaybackRequiresUserGesture(false); 
        settings.setLoadsImagesAutomatically(true); 
        settings.setUseWideViewPort(true); 
        settings.setLoadWithOverviewMode(true); 
        webView.loadUrl("https://sportspulse.example.com"); 
        // change later
    }
}
