/// <reference path="../reference.d.ts" />
App.controller('selectIdentificationDescriptionController', ['$scope', '$routeParams', 'AppBizCom', 'logicCom',
    function ($scope, $routeParams, AppBizCom, logicCom) {
        // ログ出力用画面ID定義
        var PAGE_ID_MAIN = 'G1090-01'; // 確認書類撮影開始画面
        var pageIdNext = '';
        var nextPagePath = '';
        var pageIdPre = '';
        // 確認書類修正フラグ
        var confirmFileFlg;
        // 本人確認書類修正フラグ
        var selfConfirmFileFlg;
        // 個人番号告知
        var myNumberInfo;
        // 番号確認書類持参フラグ
        var myNumberHaveFlg;
        // 個人番号確認書類区分
        var myNumberConfirmFileFlg;
        var cameraFlgControl = AppBizCom.DataHolder.getFlowControlFlg().CAMERA_FLG_CONTROL;
        var jimuJoho = AppBizCom.DataHolder.getNotifInfo().JIMU_JOHO;
        var mnsyseiryJoho = AppBizCom.DataHolder.getNotifInfo().MNSYSEIRY_JOHO;
        // 連打防止フラグ
        var rendaBtnFLG = true;
        var callbackFLG = function () { };
        // 通信エラー発生する場合、「閉じる」ボタン押下時に、「画面制御 二重制御」フラグを解除する
        var connectionErrorCallback = function () {
            rendaBtnFLG = true;
        };
        // 初期化処理
        $scope.init = function () {
            $scope.editMode = $routeParams.prev === 'applicationConfirm' ? true : false;
            if (!(typeof (cameraFlgControl) !== 'object' || cameraFlgControl == null || Object.keys(cameraFlgControl).length == 0)) {
                // 確認書類修正フラグ
                confirmFileFlg = cameraFlgControl.MOD_FLG;
                // 本人確認書類修正フラグ
                selfConfirmFileFlg = cameraFlgControl.MOD_ID_FLG;
            }
            if (!(typeof (jimuJoho) !== 'object' || jimuJoho == null || Object.keys(jimuJoho).length == 0)) {
                // 個人番号告知
                myNumberInfo = jimuJoho.MYNO_KOKUCHI;
                // 番号確認書類持参フラグ
                myNumberHaveFlg = jimuJoho.MNSYSEIRY_JISN_FLAG;
            }
            if (!(typeof (mnsyseiryJoho) !== 'object' || mnsyseiryJoho == null || Object.keys(mnsyseiryJoho).length == 0)) {
                // 個人番号確認書類区分
                myNumberConfirmFileFlg = mnsyseiryJoho.MNSYSEIRY_K;
            }
            // 本人確認書類の修正時
            if ($scope.editMode && selfConfirmFileFlg) {
                // 個人番号確認書類区分が個人番号カードの場合、「G1150-01：撮影開始説明画面」
                if (1 == myNumberConfirmFileFlg) {
                    nextPagePath = 'cameraDescription';
                    pageIdNext = 'G1150-01';
                }
                else {
                    // 個人番号確認書類区分が個人番号カード以外の場合、「G1140-01：本人確認書類のご説明・ご選択画面」
                    nextPagePath = 'selectIdentificationDoc';
                    pageIdNext = 'G1140-01';
                }
            }
            else if ($scope.editMode && confirmFileFlg) {
                // 個人番号の修正時の場合、「G1100-01：番号確認書類のご説明・ご選択画面」
                nextPagePath = 'selectNecessaryDoc';
                pageIdNext = 'G1100-01';
            }
            else if (1 == myNumberInfo || 1 == myNumberHaveFlg) {
                // 申込データ(事務手続き).事務手続き情報.個人番号告知が「1:告知する」、または
                // 申込データ(事務手続き).事務手続き情報.番号確認書類持参フラグが「1:持参あり」の場合、
                // 「G1100-01：番号確認書類のご説明・ご選択画面」
                nextPagePath = 'selectNecessaryDoc';
                pageIdNext = 'G1100-01';
            }
            else {
                // 上記以外の場合、「G1140-01：本人確認書類のご説明・ご選択画面」
                nextPagePath = 'selectIdentificationDoc';
                pageIdNext = 'G1140-01';
            }
        };
        // イベント：「戻る」ボタンタップ時
        $scope.backBtnClick = function () {
            if (!rendaBtnFLG) {
                return;
            }
            rendaBtnFLG = false;
            //「APPBIZ-J002： 業務共通領域機能」を呼び出し「画面遷移ルーティング情報の取得」処理より遷移先を取得し、前画面へ遷移する。
            var path = AppBizCom.DataHolder.getPrevRoutePath();
            logicCom.locationPath(path, callbackFLG, callbackFLG, connectionErrorCallback);
            if ($scope.editMode) {
                pageIdPre = 'G1240-01';
            }
            else {
                pageIdPre = 'G1080-01';
            }
            // アクションログ出力
            logicCom.btnTapLog(PAGE_ID_MAIN, pageIdPre, '戻る');
        };
        // イベント：「次へ」ボタンタップ時
        $scope.nextBtnClick = function () {
            if (!rendaBtnFLG) {
                return;
            }
            rendaBtnFLG = false;
            var successCallBack = function () {
                // 本人確認書類情報更新
                if (nextPagePath === 'cameraDescription') {
                    // 申込データ(事務手続き)取得
                    var applyInfo = AppBizCom.DataHolder.getNotifInfo();
                    // 本人確認書類選択（個人番号カード）
                    applyInfo.HONIN_KAKNIN_SY_JOHO = {
                        HONIN_KAKNIN_SY_K_1: '01',
                        HONIN_KAKNIN_SY_YUSO_K_1: '1',
                        HONIN_KAKNIN_SY_K_2: undefined,
                        HONIN_KAKNIN_SY_YUSO_K_2: undefined
                    };
                    // 申込データ(事務手続き)設定
                    AppBizCom.DataHolder.setNotifInfo(applyInfo);
                }
            };
            // 次画面へ遷移
            logicCom.locationPath(nextPagePath, successCallBack, callbackFLG, connectionErrorCallback);
            // アクションログ出力
            logicCom.btnTapLog(PAGE_ID_MAIN, pageIdNext, '次へ');
        };
    }]);
