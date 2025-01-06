/// <reference path="../reference.d.ts" />
App.controller('inputOperationStartController', ['$scope', 'AppBizCom', 'logicCom',
    function ($scope, AppBizCom, logicCom) {
        // ログ出力用画面ID定義
        var PAGE_ID_MAIN = 'G1070-01'; // お客様と営業員による入力開始画面
        var PAGE_ID_NEXT = 'G1080-01'; // 事務手続き画面
        var NEXT_PAGE_PATH = 'inputNotifications';
        var PAGE_ID_PRE = 'G1060-02'; // お客様検索結果画面
        // 連打防止フラグ
        var rendaBtnFLG = true;
        var callbackFLG = function () { };
        // 通信エラー発生する場合、「閉じる」ボタン押下時に、「画面制御 二重制御」フラグを解除する
        var connectionErrorCallback = function () {
            rendaBtnFLG = true;
        };
        // イベント：「戻る」ボタンタップ時
        $scope.backBtnClick = function () {
            if (!rendaBtnFLG) {
                return;
            }
            rendaBtnFLG = false;
            // 1)「APPBIZ-J002： 業務共通領域機能」を呼び出し「画面遷移ルーティング情報の取得」処理より遷移先を取得し、前画面へ遷移する。
            var path = AppBizCom.DataHolder.getPrevRoutePath();
            logicCom.locationPath(path, callbackFLG, callbackFLG, connectionErrorCallback);
            // アクションログ出力
            logicCom.btnTapLog(PAGE_ID_MAIN, PAGE_ID_PRE, '戻る');
        };
        // イベント：「次へ」ボタンタップ時
        $scope.nextBtnClick = function () {
            if (!rendaBtnFLG) {
                return;
            }
            rendaBtnFLG = false;
            // 1)「G1080-01：事務手続き画面」に遷移する。
            logicCom.locationPath(NEXT_PAGE_PATH, callbackFLG, callbackFLG, connectionErrorCallback);
            // アクションログ出力
            logicCom.btnTapLog(PAGE_ID_MAIN, PAGE_ID_NEXT, '次へ');
        };
    }]);
