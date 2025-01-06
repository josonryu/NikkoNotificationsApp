/// <reference path="../reference.d.ts" />
App.controller('applicationConfirmStartController', ['$scope', 'logicCom', 'AppBizCom',
    function ($scope, logicCom, AppBizCom) {
        // ログ出力用画面ID定義
        var PAGE_ID_MAIN = 'G1220-01'; // 申込内容確認開始画面
        var pageIdNext = '';
        var nextPagePath = '';
        var pageIdPre = '';
        var skipMaskFlg; //塗りつぶしスキップフラグ（1種類目）
        var skipMaskFlg2; //塗りつぶしスキップフラグ（2種類目）
        var jimuJoho = AppBizCom.DataHolder.getNotifInfo().JIMU_JOHO;
        var cameraFlgControl = AppBizCom.DataHolder.getFlowControlFlg().CAMERA_FLG_CONTROL;
        // 連打防止フラグ
        var rendaBtnFLG = true;
        var callbackFLG = function () { };
        // 通信エラー発生する場合、「閉じる」ボタン押下時に、「画面制御 二重制御」フラグを解除する
        var connectionErrorCallback = function () {
            rendaBtnFLG = true;
        };
        // 初期化処理
        $scope.init = function () {
            if (!(typeof (jimuJoho) !== 'object' || jimuJoho == null || Object.keys(jimuJoho).length == 0)) {
                // 日興カード申込区分
                $scope.mosikomi = jimuJoho.NIKKO_CARD;
            }
            if (!(typeof (cameraFlgControl) !== 'object' || cameraFlgControl == null || Object.keys(cameraFlgControl).length == 0)) {
                //塗りつぶしスキップフラグ（1種類目）
                skipMaskFlg = cameraFlgControl.SKIP_MASK_FLG;
                //塗りつぶしスキップフラグ（2種類目）
                skipMaskFlg2 = cameraFlgControl.SKIP_MASK_FLG2;
            }
            //「日興カード申込区分」が「1:新規」または「3:再発行」の場合
            if (1 == $scope.mosikomi || 3 == $scope.mosikomi) {
                //「G1230-01：暗証番号確認画面」へ遷移する。
                pageIdNext = 'G1230-01';
                nextPagePath = 'customerFinalInput';
            }
            else {
                //「G1240-01：お客様確認画面」へ遷移する。
                pageIdNext = 'G1240-01';
                nextPagePath = 'applicationConfirm';
            }
        };
        /**
         * イベント：「戻る」ボタンタップ時
         */
        $scope.backBtnClick = function () {
            if (!rendaBtnFLG) {
                return;
            }
            rendaBtnFLG = false;
            // 個人番号の塗りつぶしを行った場合、塗りつぶしされた状態の画像を表示
            if (skipMaskFlg || skipMaskFlg2) {
                // ルーティング情報削除
                AppBizCom.DataHolder.deleteRouteInfoByPath('cameraIdFill');
            }
            //「APPBIZ-J002： 業務共通領域機能」を呼び出し「画面遷移ルーティング情報の取得」処理より遷移先を取得し、前画面へ遷移する。
            var path = AppBizCom.DataHolder.getPrevRoutePath();
            if ('inputNotifications' == path) {
                pageIdPre = 'G1080-01';
            }
            else if ('ocrIdResult' == path) {
                pageIdPre = 'G1190-01';
            }
            else if ('ocrId2Result' == path) {
                pageIdPre = 'G1190-02';
            }
            logicCom.locationPath(path, callbackFLG, callbackFLG, connectionErrorCallback);
            // アクションログ出力
            logicCom.btnTapLog(PAGE_ID_MAIN, pageIdPre, '戻る');
        };
        /**
         * イベント：「次へ」ボタンタップ時
         */
        $scope.nextBtnClick = function () {
            if (!rendaBtnFLG) {
                return;
            }
            rendaBtnFLG = false;
            logicCom.locationPath(nextPagePath, callbackFLG, callbackFLG, connectionErrorCallback);
            // アクションログ出力
            logicCom.btnTapLog(PAGE_ID_MAIN, pageIdNext, '次へ');
        };
    }]);
