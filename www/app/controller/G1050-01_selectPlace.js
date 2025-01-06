/// <reference path="../reference.d.ts" />
App.controller('selectPlaceController', ['$scope', '$location', '$controller', 'AppBizCom', 'logicCom', 'chkSimilarConst',
    function ($scope, $location, $controller, AppBizCom, logicCom, chkSimilarConst) {
        var PAGE_ID_MAIN = 'G1050-01'; // 受付場所の選択画面
        var PAGE_ID_PREV = 'G1040-01'; // ホームメニュー画面
        var PAGE_ID_NEXT = 'G1060-01'; // お客さま検索画面
        var UKTKBASY_K_STORE = { value: '1', name: '店頭' };
        var UKTKBASY_K_VISIT = { value: '2', name: '訪問' };
        /** ボタン連打防止フラグ. */
        var stopBtnEventFLG = false;
        var callbackFLG = function () { };
        // 通信エラー発生する場合、「閉じる」ボタン押下時に、「画面制御 二重制御」フラグを解除する
        var connectionErrorCallback = function () {
            stopBtnEventFLG = false;
        };
        /** 申込データ種類管理フラグ */
        var isNotifInfo = false;
        var init = function () {
            $scope.btnNextDisabled = true;
            // 保存済み共通領域から画面への読み込み処理
            loadApplyInfo();
        };
        $scope.MODEL = {
            /** 受付店番 */
            TEN_BUKA_C: '',
            /** 行員番号 */
            SYAIN_ID: '',
        };
        $scope.inputData = {
            SYAIN_ID: {
                applyName: 'SYAIN_ID',
                id: 'txtSyainID',
                name: '行員番号',
                typeSelect: false,
                numPad: 'numkeyboard-right',
                length: 20,
            }
        };
        $scope.tBKList = [{ CD: '0391', MSY: '0391'}, { CD: '0392', MSY: '0392'}, { CD: '0395', MSY: '0395'}];
        $scope.$watch('[ukeJoho.UKTKBASY_K,MODEL.SYAIN_ID,MODEL.TEN_BUKA_C]', val => {
            var btnNextDisabled = true;
            if (val[0] && val[1] && val[2]) {
                btnNextDisabled = false;
            }
            $scope.btnNextDisabled = btnNextDisabled;
            $scope.$applyAsync();
        });
        // イベント：「店頭」ボタンタップ時
        $scope.btnStoreClick = function () {
            // ボタン連打防止フラグ
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            ;
            $scope.ukeJoho.UKTKBASY_K = UKTKBASY_K_STORE.value;
            $scope.nextBtnInActive = false;
            // ボタン連打防止フラグ
            stopBtnEventFLG = false;
        };
        // イベント：「訪問」ボタンタップ時
        $scope.btnVisitClick = function () {
            // ボタン連打防止フラグ
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            ;
            $scope.ukeJoho.UKTKBASY_K = UKTKBASY_K_VISIT.value;
            $scope.nextBtnInActive = false;
            // ボタン連打防止フラグ
            stopBtnEventFLG = false;
        };
        // イベント：「次へ」ボタンタップ時
        $scope.nextBtnClick = function () {
            // ボタン連打防止フラグ
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            ;
            // 共通領域保存処理
            setNotifInfo();
            // ログ出力
            var actionLog = {
                UKTKBASY_K: {
                    value: $scope.ukeJoho.UKTKBASY_K
                }
            };
            logicCom.btnTapLog(PAGE_ID_MAIN, PAGE_ID_NEXT, '次へ', actionLog);
            // 「G1060-01：お客さま検索画面」へ遷移する。
            logicCom.locationPath('selectCustomer', callbackFLG, callbackFLG, connectionErrorCallback);
        };
        // イベント：「戻る」ボタンタップ時
        $scope.btnBackClick = function () {
            // ボタン連打防止フラグ
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            ;
            // 前画面へ遷移する。遷移先は共通処理「APPBIZ-00010：業務共通領域」により取得する。
            var path = AppBizCom.DataHolder.getPrevRoutePath();
            logicCom.locationPath(path, callbackFLG, callbackFLG, connectionErrorCallback);
            // アクションログ出力
            logicCom.btnTapLog(PAGE_ID_MAIN, PAGE_ID_PREV, '戻る');
        };
        // 保存済み共通領域から画面への読み込み処理
        var loadApplyInfo = function () {
            if (typeof AppBizCom.DataHolder.getEFormInfo() === "undefined") {
                var applyInfo = AppBizCom.DataHolder.getNotifInfo();
                isNotifInfo = true;
            }
            else {
                var applyInfo = AppBizCom.DataHolder.getEFormInfo();
                isNotifInfo = false;
            }
            $scope.ukeJoho = angular.copy(applyInfo.UKE_JOHO) || {};
        };
        // 共通領域保存処理
        var setNotifInfo = function () {
            if (isNotifInfo) {
                var applyInfo = AppBizCom.DataHolder.getNotifInfo();
                applyInfo.UKE_JOHO = $scope.ukeJoho;
                AppBizCom.DataHolder.setNotifInfo(applyInfo);
            }
            else {
                var applyInfo = AppBizCom.DataHolder.getEFormInfo();
                applyInfo.UKE_JOHO = $scope.ukeJoho;
                AppBizCom.DataHolder.setEFormInfo(applyInfo);
            }
            // ログイン者データの設定
            var loginInfo = {
                PROPER_C: $scope.MODEL.SYAIN_ID,
                UKETSUKE_MISE_C: $scope.MODEL.TEN_BUKA_C,
            };
            AppBizCom.DataHolder.setLoginInfo(loginInfo);
        };
        init();
    }]);
