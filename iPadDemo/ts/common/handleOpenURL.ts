// 起動されていないアプリを開くイベントを定義
if (!(<any>window).handleOpenURL) {

    (<any>window).rootURL = location.href;

    (<any>window).handleOpenURL = function(url: string) {
        localStorage.setItem('launchURL', url);
    }
}