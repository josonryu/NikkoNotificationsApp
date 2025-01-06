/// <reference path="../reference.d.ts" />
App.controller('cameraIdThirdResultController', ['$scope', '$controller', 'appConst', 'logicCom', 'AppBizCom',
    function ($scope, $controller, appConst, logicCom, AppBizCom) {
        // G1160用処理読み込み
        $controller('startCameraId', { $scope: $scope });
        // カメラプラグイン関係エラーメッセージ
        var ERR_TITLE = AppBizCom.Msg.getMsg('KKAP-CM000-06E', []);
        var ERR_CONTENTS = AppBizCom.Msg.getMsg('KKAP-CM000-07E', []);
        var ERR_LOG_MESSAGE_ID = 'KKAP-CM000-07E';
        var DISPLAY_MODAL_ID = 'G1160-01'; // 撮影書面表示画面
        var SHOOTING_PAGE_ID = 'G1170-01'; // カメラ撮影（本人確認書類）画面
        var MAIN_PAGE_ID = 'G1180-03'; // 撮影結果表示(1枚目)画面
        var ERR_MODAL_ID = 'G1020-02'; // エラーモーダル画面
        // ボタン連打防止フラグ
        var stopBtnEventFLG = false;
        var callbackFLG = function () { };
        // 通信エラー発生する場合、「閉じる」ボタン押下時に、「画面制御 二重制御」フラグを解除する
        var connectionErrorCallback = function () {
            stopBtnEventFLG = false;
        };
        var targetItem = undefined;
        // 本人確認書類で処理する対象
        var targetIdentity = 0; // 1: 第１種類目 //2: 第２種類目
        // 画面IDなどの設定
        // 初期処理内で本人確認書類の情報を取得し、設定する
        var personDocInfo = null;
        // 画面初期化処理
        var initDisplay = () => {
            // おもて面の画像設定
            var imageData = AppBizCom.DataHolder.getImageData();
            var picture = '';
            var pictureConfirm = 'こちらでよろしいですか？';
            // 第２種類目のデータがあるか判断する
            if (imageData != null && imageData.HONIN_KAKNIN_SY2_GAZO3) {
                targetIdentity = 2;
                targetItem = 'HONIN_KAKNIN_SY2_GAZO3';
                // 撮影画像取得(第２種類目おもて面)
                picture = 'data:image/jpeg;base64,' + imageData[targetItem];
            }
            else if (imageData != null && imageData.HONIN_KAKNIN_SY1_GAZO3) {
                targetIdentity = 1;
                targetItem = 'HONIN_KAKNIN_SY1_GAZO3';
                // 第１種類目のデータがあるか判断する
                picture = 'data:image/jpeg;base64,' + imageData[targetItem];
            }
            // 撮影画像設定
            $scope.targetIdentity = targetIdentity;
            $scope.cardThirdimg = picture;
            $scope.pictureConfirm = pictureConfirm;
            // 申込データ(事務手続き)取得
            var info = AppBizCom.DataHolder.getNotifInfo();
            // 表示用に対象書類情報を取得
            personDocInfo = AppBizCom.MstData.getCodeMstDataByCd('HONIN_KAKNIN_SY', info.HONIN_KAKNIN_SY_JOHO['HONIN_KAKNIN_SY_K_' + targetIdentity.toString()]);
            // タイトル設定
            $scope.docName = personDocInfo.MSY + appConst.CAM_TITLE_SUFF.THIRD_NAME;
        };
        // イベント：初期処理
        $scope.init = function () {
        };
        // 初期化処理
        var init = () => {
            // 画面初期化
            initDisplay();
        };
        // イベント：「再撮影」ボタンタップ時
        $scope.btnTakeRetryClick = () => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            // 「G1170-01:カメラ撮影（本人確認書類）画面」表示
            $scope.popupMode = 'THIRD';
            $scope.cameraTitle = $scope.docName;
            logicCom.change2CameraPreview(MAIN_PAGE_ID, undefined, SHOOTING_PAGE_ID);
            // ログ出力
            logicCom.btnTapLog(MAIN_PAGE_ID, SHOOTING_PAGE_ID, '再撮影');
            takePicModeScan(); // スキャン撮影
        };
        // イベント：「次へ」ボタンタップ時
        $scope.btnNextClick = () => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            var info = AppBizCom.DataHolder.getNotifInfo();
            var selectedInfo = info.HONIN_KAKNIN_SY_JOHO;
            var personDocInfo = AppBizCom.MstData.getCodeMstDataByCd('HONIN_KAKNIN_SY', selectedInfo['HONIN_KAKNIN_SY_K_' + targetIdentity.toString()]);
            // １種類目のとき
            if (targetIdentity === 1) {
                // ２種類目の撮影がない場合、「G1190-01:撮影結果確認（1種類目）画面」へ遷移
                if (selectedInfo.HONIN_KAKNIN_SY_YUSO_K_2 !== '1') {
                    logicCom.btnTapLog(MAIN_PAGE_ID, 'G1190-01', '次へ');
                    logicCom.locationPath('ocrIdResult', callbackFLG, callbackFLG, connectionErrorCallback);
                    $scope.$applyAsync();
                }
                else {
                    logicCom.btnTapLog(MAIN_PAGE_ID, DISPLAY_MODAL_ID, '次へ');
                    $scope.popupMode = 'FRONT';
                    $scope.initIdentityDocInfo(2, MAIN_PAGE_ID, DISPLAY_MODAL_ID);
                    $('#' + DISPLAY_MODAL_ID).modal('show');
                    stopBtnEventFLG = false;
                }
            }
            else if (targetIdentity === 2) {
                // 1種類目撮影済みの場合
                if (selectedInfo.HONIN_KAKNIN_SY_YUSO_K_1 === '1') {
                    // 「G1190-01:撮影結果確認（1種類目）画面」へ遷移
                    logicCom.btnTapLog(MAIN_PAGE_ID, 'G1190-01', '次へ');
                    logicCom.locationPath('ocrIdResult', callbackFLG, callbackFLG, connectionErrorCallback);
                    $scope.$applyAsync();
                }
                else {
                    // 「G1190-02:撮影結果確認（2種類目）画面」へ遷移
                    logicCom.btnTapLog(MAIN_PAGE_ID, 'G1190-02', '次へ');
                    logicCom.locationPath('ocrId2Result', callbackFLG, callbackFLG, connectionErrorCallback);
                    $scope.$applyAsync();
                }
            }
        };
        // 画面リロード
        // OCRを使用した場合、撮影成功時に画面を更新する
        $scope.reloadPage = () => {
            $('#G1160-01').modal('hide');
            $('#G1160-02').modal('hide');
            init();
        };
        // カメラスキャン(再)撮影処理
        var takePicModeScan = () => {
            // カメラスキャン起動
            AppBizCom.Camera.startCamScan(
            // 撮影成功時
            camInfo => {
                // 共通領域へ保存
                var imageData = AppBizCom.DataHolder.getImageData();
                // 画像データ設定
                imageData[targetItem] = camInfo.image;
                AppBizCom.DataHolder.setImageData(imageData);
                logicCom.change2DefaultView(MAIN_PAGE_ID, undefined, SHOOTING_PAGE_ID);
                // ログ出力
                logicCom.callbackLog(SHOOTING_PAGE_ID, MAIN_PAGE_ID, 'カメラ撮影成功');
                // 画面初期化
                initDisplay();
                stopBtnEventFLG = false;
                $scope.$applyAsync();
            }, 
            // エラー発生時
            error => {
                // エラーダイアログを表示する
                $scope.openErrorInfo(ERR_TITLE, ERR_CONTENTS);
                // ログ出力
                logicCom.callbackErrLog(SHOOTING_PAGE_ID, ERR_MODAL_ID, 'カメラ撮影エラー');
                logicCom.change2DefaultView(MAIN_PAGE_ID, undefined, SHOOTING_PAGE_ID);
                // カメラプラグイン終了
                AppBizCom.Camera.deinitCamScan(() => { }, () => { });
                stopBtnEventFLG = false;
            }, 
            // キャンセル時
            () => {
                // ログ出力
                logicCom.callbackLog(SHOOTING_PAGE_ID, MAIN_PAGE_ID, 'cancelCallBack', 'カメラ撮影キャンセル');
                logicCom.change2DefaultView(MAIN_PAGE_ID, undefined, SHOOTING_PAGE_ID);
                stopBtnEventFLG = false;
            });
        };
        init();
    }]);
