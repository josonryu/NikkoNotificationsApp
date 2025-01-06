/// <reference path="../reference.d.ts" />
App.controller('cameraIdBackResultController', ['$scope','$controller','appConst','logicCom','AppBizCom',
    function ($scope, $controller, appConst, logicCom, AppBizCom) {

        // G1160用処理読み込み
        $controller('startCameraId', {$scope: $scope});
       
        // カメラプラグイン関係エラーメッセージ
        var ERR_TITLE: string = AppBizCom.Msg.getMsg('KKAP-CM000-06E', []);
        var ERR_CONTENTS: string = AppBizCom.Msg.getMsg('KKAP-CM000-07E', []);
        var ERR_LOG_MESSAGE_ID: string = 'KKAP-CM000-07E';

        var DISPLAY_MODAL_ID: string = 'G1160-01';   // 撮影書面表示画面
        var SHOOTING_PAGE_ID: string = 'G1170-01';  // カメラ撮影（本人確認書類）画面
        var MAIN_PAGE_ID: string = 'G1180-02';  // 撮影結果表示(1枚目)画面
        var ERR_MODAL_ID: string = 'G1020-02';       // エラーモーダル画面

        // ボタン連打防止フラグ
        var stopBtnEventFLG: boolean = false;
        var callbackFLG = function () { };
        // 通信エラー発生する場合、「閉じる」ボタン押下時に、「画面制御 二重制御」フラグを解除する
        var connectionErrorCallback = function () {
            stopBtnEventFLG = false;
        };

        var targetItem: string = undefined;

        // 本人確認書類で処理する対象
        var targetIdentity: number = 0; // 1: 第１種類目 //2: 第２種類目

        // 画面IDなどの設定
        // 初期処理内で本人確認書類の情報を取得し、設定する
        var personDocInfo: any = null;
        var docTypeName: string  = '';

        // 画面初期化処理
        var initDisplay = (): void => {
            // おもて面の画像設定
            var imageData: any = AppBizCom.DataHolder.getImageData();
            var picture: string = '';
            var pictureConfirm: string = 'こちらでよろしいですか？';

            // 第２種類目のデータがあるか判断する
            if (imageData != null && imageData.HONIN_KAKNIN_SY2_GAZO2) {
                targetIdentity = 2;
                targetItem = 'HONIN_KAKNIN_SY2_GAZO2';
                // 撮影画像取得(第２種類目おもて面)
                picture = 'data:image/jpeg;base64,' + imageData[targetItem];

            } else if (imageData != null && imageData.HONIN_KAKNIN_SY1_GAZO2) {
                targetIdentity = 1;
                targetItem = 'HONIN_KAKNIN_SY1_GAZO2';
                // 第１種類目のデータがあるか判断する
                picture = 'data:image/jpeg;base64,' + imageData[targetItem];
            }

            // 撮影画像設定
            $scope.targetIdentity = targetIdentity;
            $scope.cardBackimg = picture;
            $scope.pictureConfirm = pictureConfirm;
            // 申込データ(事務手続き)取得
            var info: any = AppBizCom.DataHolder.getNotifInfo();
            // 表示用に対象書類情報を取得
            personDocInfo = AppBizCom.MstData.getCodeMstDataByCd('HONIN_KAKNIN_SY', info.HONIN_KAKNIN_SY_JOHO['HONIN_KAKNIN_SY_K_' + targetIdentity.toString()]);

            // タイトル設定
            if (personDocInfo.STM3 && personDocInfo.STM3.length < 3 && personDocInfo.CD !== '03' && personDocInfo.CD !== '13') {
                docTypeName = appConst.CAM_TITLE_SUFF.BACK_NAME;
            } else {
                docTypeName = appConst.CAM_TITLE_SUFF.SECOND_NAME;
            }
            $scope.docName = personDocInfo.MSY + docTypeName;
        };

        // イベント：初期処理
        $scope.init = function(){
        }

        // 初期化処理
        var init = (): void => {
            // 画面初期化
            initDisplay();
        }
        
        // イベント：「再撮影」ボタンタップ時
        $scope.btnTakeRetryClick = (): void => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            }

            // 「G1170-01:カメラ撮影（本人確認書類）画面」表示
            $scope.popupMode = 'BACK';
            $scope.cameraTitle = $scope.docName;
            logicCom.change2CameraPreview(MAIN_PAGE_ID, undefined, SHOOTING_PAGE_ID);
            // ログ出力
            logicCom.btnTapLog(MAIN_PAGE_ID, SHOOTING_PAGE_ID, '再撮影');
            takePicModeScan(); // スキャン撮影
        };

        // イベント：「次へ」ボタンタップ時
        $scope.btnNextClick = (): void =>  {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            }

            var info: any = AppBizCom.DataHolder.getNotifInfo();
            var selectedInfo: any = info.HONIN_KAKNIN_SY_JOHO
            var personDocInfo: any = AppBizCom.MstData.getCodeMstDataByCd('HONIN_KAKNIN_SY', selectedInfo['HONIN_KAKNIN_SY_K_' + targetIdentity.toString()]);

            // １種類目のとき
            if (targetIdentity === 1) {
                // 撮影枚数が3枚以上の書面の場合「G1160-01:撮影書面表示画面」表示
                if (personDocInfo.STM3.length > 2) {
                    logicCom.btnTapLog(MAIN_PAGE_ID, DISPLAY_MODAL_ID, '次へ');
                    $scope.popupMode = 'THIRD';
                    $scope.initIdentityDocInfo(targetIdentity, MAIN_PAGE_ID, DISPLAY_MODAL_ID);
                    $('#' + DISPLAY_MODAL_ID).modal('show');
                    stopBtnEventFLG = false;
                // ２種類目の撮影がない場合、「G1190-01:撮影結果確認（1種類目）画面」へ遷移
                } else if (selectedInfo.HONIN_KAKNIN_SY_YUSO_K_2 !== '1') {
                    logicCom.btnTapLog(MAIN_PAGE_ID, 'G1190-01', '次へ');
                    logicCom.locationPath('ocrIdResult', callbackFLG, callbackFLG, connectionErrorCallback);
                    $scope.$applyAsync();
                // ２種類目を撮影する場合「G1160-01:撮影書面表示画面」表示
                } else {
                    logicCom.btnTapLog(MAIN_PAGE_ID, DISPLAY_MODAL_ID, '次へ');
                    $scope.popupMode = 'FRONT';
                    $scope.initIdentityDocInfo(2, MAIN_PAGE_ID, DISPLAY_MODAL_ID);
                    $('#' + DISPLAY_MODAL_ID).modal('show');
                    stopBtnEventFLG = false;
                }
            // 2種類目のとき
            } else if(targetIdentity === 2){
                // 撮影枚数が3枚以上の書面の場合「G1160-01:撮影書面表示画面」表示
                if (personDocInfo.STM3.length > 2) {
                    logicCom.btnTapLog(MAIN_PAGE_ID, DISPLAY_MODAL_ID, '次へ');
                    $scope.popupMode = 'THIRD';
                    $scope.initIdentityDocInfo(targetIdentity, MAIN_PAGE_ID, DISPLAY_MODAL_ID);
                    $('#' + DISPLAY_MODAL_ID).modal('show');
                    stopBtnEventFLG = false;
                // 1種類目撮影済みの場合
                } else if (selectedInfo.HONIN_KAKNIN_SY_YUSO_K_1 === '1') {
                    // 「G1190-01:撮影結果確認（1種類目）画面」へ遷移
                    logicCom.btnTapLog(MAIN_PAGE_ID, 'G1190-01', '次へ');
                    logicCom.locationPath('ocrIdResult', callbackFLG, callbackFLG, connectionErrorCallback);
                    $scope.$applyAsync();
                } else {
                    // 「G1190-02:撮影結果確認（2種類目）画面」へ遷移
                    logicCom.btnTapLog(MAIN_PAGE_ID, 'G1190-02', '次へ');
                    logicCom.locationPath('ocrId2Result', callbackFLG, callbackFLG, connectionErrorCallback);
                    $scope.$applyAsync();
                }
            }
        }

        // 画面リロード
        // OCRを使用した場合、撮影成功時に画面を更新する
        $scope.reloadPage = (): void => {
            $('#G1160-01').modal('hide');
            $('#G1160-02').modal('hide');
            init();
        };

        // カメラスキャン(再)撮影処理
        var takePicModeScan = (): void => {
            // カメラスキャン起動
            AppBizCom.Camera.startCamScan(
                // 撮影成功時
                camInfo => {

                    // 共通領域へ保存
                    var imageData: any = AppBizCom.DataHolder.getImageData();

                    // 画像データ設定
                    imageData[targetItem] = camInfo.image;
                    AppBizCom.DataHolder.setImageData(imageData);

                    // 運転免許証（裏面）自動マスク処理
                    if (personDocInfo.CD === '02' && camInfo.mode == 1) {
                        logicCom.autoMask(2, 2);
                    }else{
                        // 自動マスク情報クリア
                        imageData = AppBizCom.DataHolder.getImageData();
                        imageData.AUTO_FILL_GAZO2 = undefined;
                        AppBizCom.DataHolder.setImageData(imageData);
                    }

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
                    AppBizCom.Camera.deinitCamScan((): void => {}, (): void => {});
                    stopBtnEventFLG = false;
                },
                // キャンセル時
                (): void => {
                    // ログ出力
                    logicCom.callbackLog(SHOOTING_PAGE_ID, MAIN_PAGE_ID, 'cancelCallBack', 'カメラ撮影キャンセル');
                    logicCom.change2DefaultView(MAIN_PAGE_ID, undefined, SHOOTING_PAGE_ID);
                    stopBtnEventFLG = false;
                },
            );
        };
        init();
    }]);