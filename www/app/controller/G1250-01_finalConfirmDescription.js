/// <reference path="../reference.d.ts" />
App.controller('finalConfirmDescriptionController', ['$scope', 'logicCom',
    function ($scope, logicCom) {
        // ログ出力用画面ID定義
        var PAGE_ID_MAIN = 'G1250-01'; // 営業員確認開始画面
        var PAGE_ID_NEXT = 'G1260-01'; // 営業員確認画面
        var NEXT_PAGE_PATH = 'finalConfirm';
        // 連打防止フラグ
        var rendaBtnFLG = true;
        var callbackFLG = function () { };
        // 通信エラー発生する場合、「閉じる」ボタン押下時に、「画面制御 二重制御」フラグを解除する
        var connectionErrorCallback = function () {
            rendaBtnFLG = true;
        };
        // イベント：「次へ」ボタンタップ時
        $scope.nextBtnClick = function () {
            if (!rendaBtnFLG) {
                return;
            }
            rendaBtnFLG = false;
            //「G1260-01：営業員確認画面」に遷移する。
            logicCom.locationPath(NEXT_PAGE_PATH, callbackFLG, callbackFLG, connectionErrorCallback);
            // アクションログ出力
            logicCom.btnTapLog(PAGE_ID_MAIN, PAGE_ID_NEXT, '次へ');
        };
    }]);
