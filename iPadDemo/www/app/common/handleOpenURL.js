// 起動されていないアプリを開くイベントを定義
if (!window.handleOpenURL) {
    window.rootURL = location.href;
    window.handleOpenURL = function (url) {
        localStorage.setItem('launchURL', url);
    };
}
