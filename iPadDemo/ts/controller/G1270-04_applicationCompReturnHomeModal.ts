/// <reference path="../reference.d.ts" />
App.controller('applicationCompReturnHomeModalController', ['$scope', 'logicCom', 'AppBizDataHolder',
    function ($scope, logicCom, AppBizDataHolder) {

        /** 画面ID. */
        $scope.TO_PAGE_ID = 'G1270-04';

        /** ホームメニュー画面. */
        var HOME_MENU_ID: string = 'G1040-01';
        var HOME_MENU_NAME: string = 'homeMenu';

        /** ボタン名. */
        $scope.RETURN_HOME_BTN_NAME = 'ホームへ戻る';
        var YES_BTN_NAME: string = 'はい';
        var NO_BTN_NAME: string = 'いいえ';

        /** ボタン連打防止フラグ. */
        var stopBtnEventFLG = false;
        var callbackFLG = function () { };
        // 通信エラー発生する場合、「閉じる」ボタン押下時に、「画面制御 二重制御」フラグを解除する
        var connectionErrorCallback = function () {
            stopBtnEventFLG = false;
        };

        // スクロールの設定
        var scrollLock = function () {
            $('.scrollArea').css({ '-webkit-overflow-scrolling': 'auto' });
        };
        var scrollUnlock = function () {
            $('.scrollArea').css({ '-webkit-overflow-scrolling': 'touch' });
        };

        /**
         * 初期化処理
         * 
         * @returns void
         */
        var init = function (): void {

        };

        /**
         * イベント：「はい」ボタンタップ
         * 
         * @returns void
         */
        $scope.returnHomeYes = function (): void {

            // ボタン連打防止フラグ
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            };
            // 共通領域を初期化する
            AppBizDataHolder.setCustomer({});       // 既契約顧客情報
            AppBizDataHolder.setNotifInfo({});      // 申込データ(事務手続き)
            AppBizDataHolder.setPersonInfo({});     // 申込データ(特定個人情報)
            AppBizDataHolder.setImageData({});      // 画像データ
            AppBizDataHolder.setFlowControlFlg({}); // 画面遷移制御フラグ情報
            AppBizDataHolder.setEFormInfo({});      // 申込データ(電子帳票)
            AppBizDataHolder.setLocation({});       // 位置情報
            AppBizDataHolder.clearRouteInfo();      // 画面遷移ルーティング情報
            // 01-2022-06-224 本人確認書類撮影画面のガード対応 開始 20221031
            AppBizDataHolder.setOcrData({});        // OCR結果データ
            // 01-2022-06-224 本人確認書類撮影画面のガード対応 終了 20221031


            $('body').removeClass('is-modal-open');
            scrollUnlock();
            // アクションログ出力
            logicCom.btnTapLog($scope.TO_PAGE_ID, HOME_MENU_ID, YES_BTN_NAME);
            // ホームメニュー画面に遷移
            logicCom.locationPath(HOME_MENU_NAME, callbackFLG, callbackFLG, connectionErrorCallback);
        };

        /**
         * イベント：「いいえ」ボタンタップ
         * 
         * @returns void
         */
        $scope.returnHomeNo = function (): void {

            // アクションログ出力
            logicCom.btnTapLog($scope.TO_PAGE_ID, $scope.PAGE_ID, NO_BTN_NAME);
            // モーダルを閉じる
            $('body').removeClass('is-modal-open');
            scrollUnlock();

        };

        init();
    }]);