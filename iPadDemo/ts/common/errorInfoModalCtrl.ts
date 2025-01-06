/// <reference path="../reference.d.ts" />
App.controller('errorInfoModalCtrl', ['$scope', function($scope) {
    // モーダル画面が表示される時、呼び出し元画面をスクロールできないように制御
    var scrollLock = function () {
        $('.scrollArea').css({ '-webkit-overflow-scrolling': 'auto' });
    };
    // モーダル画面が閉じられる時、呼び出し元画面をスクロールできるように制御
    var scrollUnlock = function () {
        $('.scrollArea').css({ '-webkit-overflow-scrolling': 'touch' });
    };
    /**
     * エラーメッセージ画面を閉じる
     */
    $scope.closeErrorInfo = function(){
        $('#G1020').modal('hide');
    };
    /**
     * 指定のタイトル、内容でエラーメッセージ画面を表示する
     * (閉じるボタン無し)
     * @param  {} title
     * @param  {} contents
     */
    $scope.openErrorInfo = function(title, contents){
        scrollLock();
        $('#footerMessage').show();
        $('#footerCloseButton').hide();
        $('#txtTitle').html(title);
        $('#txtContents').html(contents);
        $('#G1020').modal('show');
        // ぼかしの背景のため、bodyにクラスを追加
        $('body').addClass('is-modal-open');

        // 数字キーボードよりも前面にエラーメッセージを表示するための対応
        $('.modal-open .modal').css({'z-index': 3000});
        $('.modal-backdrop.fade').css({'z-index': 2999});
    };
    // 閉じるボタンタップ時コールバック関数
    $scope.closeButtonCallback = undefined;
    /**
     * 指定のタイトル、内容でエラーメッセージ画面を表示する
     * (閉じるボタンあり)
     * @param  {} title
     * @param  {} contents
     * @param  {} callback
     */
    $scope.openErrorInfoCloseable = function(title, contents, callback){
        scrollLock();
        $('#footerMessage').hide();
        $('#footerCloseButton').show();
        $('#txtTitle').html(title);
        $('#txtContents').html(contents);
        var $modalObj = $('#G1020');
        $modalObj.modal('show');
        // ぼかしの背景のため、bodyにクラスを追加
        $('body').addClass('is-modal-open');
        // 閉じるボタンタップ時コールバック関数初期化
        $scope.closeButtonCallback = undefined;
        // 閉じるボタンタップ時コールバックセット
        if(typeof callback == 'function'){
            $scope.closeButtonCallback = callback;
        }
        // モーダル閉じた際のイベント処理
        $modalObj.off('hidden.bs.modal').on('hidden.bs.modal', function (e) {
            // 閉じるボタンタップ時コールバック
            if(typeof $scope.closeButtonCallback == 'function'){
                $scope.closeButtonCallback();
                // ぼかしの背景を消すため、bodyにクラスを削除
                $('body').removeClass('is-modal-open');
                scrollUnlock();
            }
            // 閉じるボタンタップ時コールバック関数初期化
            $scope.closeButtonCallback = undefined;
        });
    };
    /**
     * エラーメッセージ画面が起動しているか確認する
     */
    $scope.isOpenErrorInfo = function(){
        return $('#G1020').is('vidible');
    };
}]);