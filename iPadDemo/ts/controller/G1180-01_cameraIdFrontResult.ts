/// <reference path="../reference.d.ts" />
// 01-2022-06-224 本人確認書類撮影画面のガード対応 開始 20221031
App.controller('cameraIdFrontResultController', ['$scope','$controller','$sce','appConst','logicCom','AppBizCom','AppBizMsg',
    function ($scope, $controller, $sce, appConst, logicCom, AppBizCom, AppBizMsg) {
// 01-2022-06-224 本人確認書類撮影画面のガード対応 終了 20221031

        // G1160用処理読み込み
        $controller('startCameraId', {$scope: $scope});
       
        // カメラプラグイン関係エラーメッセージ
        var ERR_TITLE: string = AppBizCom.Msg.getMsg('KKAP-CM000-06E', []);
        var ERR_CONTENTS: string = AppBizCom.Msg.getMsg('KKAP-CM000-07E', []);
        var ERR_LOG_MESSAGE_ID: string = 'KKAP-CM000-07E';

        var DISPLAY_MODAL_ID: string = 'G1160-01';   // 撮影書面表示画面
        var SHOOTING_PAGE_ID: string = 'G1170-01';  // カメラ撮影（本人確認書類）画面
        var MAIN_PAGE_ID: string = 'G1180-01';  // 撮影結果表示(1枚目)画面
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

// 01-2022-06-224 本人確認書類撮影画面のガード対応 開始 20221031
        // 個人番号カードの選択有無
        var selectedNumInfo: string = undefined;
// 01-2022-06-224 本人確認書類撮影画面のガード対応 終了 20221031

        // 妥当性判定初期設定
        $scope.frontImageExist = false;

        // 画面初期化処理
        var initDisplay = (): void => {
            // おもて面の画像設定
            var imageData: any = AppBizCom.DataHolder.getImageData();
            var picture: string = '';
            var pictureConfirm: string = 'こちらでよろしいですか？';
            var frontImageExist: boolean = false;

            // 第２種類目のデータがあるか判断する
            if (imageData != null && imageData.HONIN_KAKNIN_SY2_GAZO1) {
                targetIdentity = 2;
                targetItem = 'HONIN_KAKNIN_SY2_GAZO1';
                // 撮影画像取得(第２種類目おもて面)
                picture = 'data:image/jpeg;base64,' + imageData[targetItem];
                frontImageExist = true;

            } else if (imageData != null && imageData.HONIN_KAKNIN_SY1_GAZO1) {
                targetIdentity = 1;
                targetItem = 'HONIN_KAKNIN_SY1_GAZO1';
                // 第１種類目のデータがあるか判断する
                picture = 'data:image/jpeg;base64,' + imageData[targetItem];
                frontImageExist = true;
            }

            // 撮影画像設定
            $scope.targetIdentity = targetIdentity;
            $scope.cardFrontimg = picture;
// 01-2022-06-224 本人確認書類撮影画面のガード対応 開始 20221031
            // $scope.pictureConfirm = pictureConfirm;
// 01-2022-06-224 本人確認書類撮影画面のガード対応 終了 20221031
            $scope.frontImageExist = frontImageExist;
            // 申込データ(事務手続き)取得
            var info: any = AppBizCom.DataHolder.getNotifInfo();
            // 表示用に対象書類情報を取得
            personDocInfo = AppBizCom.MstData.getCodeMstDataByCd('HONIN_KAKNIN_SY', info.HONIN_KAKNIN_SY_JOHO['HONIN_KAKNIN_SY_K_' + targetIdentity.toString()]);

// 01-2022-06-224 本人確認書類撮影画面のガード対応 開始 20221031
            // 個人番号カードの選択有無
            selectedNumInfo = info.MNSYSEIRY_JOHO ? info.MNSYSEIRY_JOHO.MNSYSEIRY_K : undefined;
// 01-2022-06-224 本人確認書類撮影画面のガード対応 終了 20221031

            // タイトル設定
            if (personDocInfo.STM3 && personDocInfo.STM3.length < 3 && personDocInfo.CD !== '03' && personDocInfo.CD !== '13') {
                docTypeName = appConst.CAM_TITLE_SUFF.FRONT_NAME;
            } else {
                docTypeName = appConst.CAM_TITLE_SUFF.FIRST_NAME;
            }
            $scope.docName = personDocInfo.MSY + docTypeName;
// 01-2022-06-224 本人確認書類撮影画面のガード対応 開始 20221031
            // 本人確認書類カードタイプチェック
            var ocrData: any = AppBizCom.DataHolder.getOcrData();
            $scope.isAutoandCardTypeErr = (ocrData.MODE === 1) && !chkCardTypeMatch(personDocInfo.CD, ocrData.CARD_TYPE);
            // 撮影モードが自動モードで本人確認書類カードタイプ不一致の場合、文言とレイアウト変更
            if ($scope.isAutoandCardTypeErr) {
                $scope.pictureConfirm = $sce.trustAsHtml(AppBizMsg.getMsg('KKAP-SFJ11-01E', [personDocInfo.MSY]));
            }
            else {
                $scope.pictureConfirm = $sce.trustAsHtml(pictureConfirm);
            }
// 01-2022-06-224 本人確認書類撮影画面のガード対応 終了 20221031
        };

        // イベント：初期処理
        $scope.init = (): void => {
        }

        // 初期化処理
        var init = (): void => {
            // 申込データ(事務手続き)取得
            var info: any = AppBizCom.DataHolder.getNotifInfo();
            // 個人番号カードの選択有無
            $scope.isMynumber = info.HONIN_KAKNIN_SY_JOHO.HONIN_KAKNIN_SY_K_1 === '01';
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
            $scope.popupMode = 'FRONT';
            $scope.guideType = personDocInfo.CD;
            $scope.cameraTitle = $scope.docName;
            logicCom.change2CameraPreview(MAIN_PAGE_ID, undefined, SHOOTING_PAGE_ID);
            // ログ出力
            logicCom.btnTapLog(MAIN_PAGE_ID, SHOOTING_PAGE_ID, '再撮影');
            if (personDocInfo.CD === '01' || // 運転免許証（表面）
                personDocInfo.CD === '02' || // 個人番号カード（表面）
                personDocInfo.CD === '04' || // 在留カード（表面）
                personDocInfo.CD === '05'){  // 特別永住者証明書（表面）
                
                takePicModeOcr(); // OCR撮影
            } else {
                
                takePicModeScan(); // スキャン撮影
            }
        };

        // イベント：「次へ」ボタンタップ時
        $scope.btnNextClick = (): void =>  {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            }

            if($scope.isMynumber){
                // ログ出力
                logicCom.btnTapLog(MAIN_PAGE_ID, 'G1190-01', '次へ');
                logicCom.locationPath('ocrIdResult', callbackFLG, callbackFLG, connectionErrorCallback);
            }else{
                $scope.popupMode = 'BACK';
                $scope.initIdentityDocInfo(targetIdentity, MAIN_PAGE_ID , DISPLAY_MODAL_ID);

                // ログ出力
                logicCom.btnTapLog(MAIN_PAGE_ID, DISPLAY_MODAL_ID, '次へ');
                // モーダル表示
                $('#' + DISPLAY_MODAL_ID).modal('show');
                stopBtnEventFLG = false;
            }
        };

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

        // カメラOCR(再)撮影処理
        var takePicModeOcr = (): void => {
            AppBizCom.Camera.startCamOcr(
                // 撮影成功時
                camInfo => {

                    // 共通領域へ保存
                    var imageData: any = AppBizCom.DataHolder.getImageData();

                    // 画像データ設定
                    imageData[targetItem] = camInfo.image;
                    AppBizCom.DataHolder.setImageData(imageData);

                    // 撮影モードが自動モードの場合
                    if(camInfo.mode === 1){
                        // 個人番号カード（表面）、または運転免許証（表面）の場合自動マスク処理
                        if(personDocInfo.CD === '01'){
                            logicCom.autoMask(1, 1);
                        }else if(personDocInfo.CD === '02'){
                            logicCom.autoMask(2, 1);
                        }
                    }else{
                        // 自動マスク情報クリア
                        imageData = AppBizCom.DataHolder.getImageData();
                        imageData.AUTO_FILL_GAZO1 = undefined;
                        AppBizCom.DataHolder.setImageData(imageData);
                    }

                    // 共通領域へ保存する
                    // logicCom.setOcrResult2DataHolder(camInfo, 
// 01-2022-06-224 本人確認書類撮影画面のガード対応 開始 20221031
                    logicCom.setOcrResult2DataHolderJimu(camInfo, 
                        (): void => {
// 01-2022-06-224 本人確認書類撮影画面のガード対応 終了 20221031
                            // 再撮影を反映
                            $scope.cardFrontimg = 'data:image/jpeg;base64,' + camInfo.image;
                            // ログ出力
                            logicCom.callbackLog(SHOOTING_PAGE_ID, MAIN_PAGE_ID, 'カメラOCR撮影成功');
                            logicCom.change2DefaultView(MAIN_PAGE_ID, undefined, SHOOTING_PAGE_ID);
                            // 画面初期化
                            initDisplay();
                            stopBtnEventFLG = false;
                            $scope.$applyAsync();
// 01-2022-06-224 本人確認書類撮影画面のガード対応 開始 20221031
                        // },
                        // error => {
                        //     // 失敗時
                        //     // エラーダイアログを表示する
                        //     $scope.openErrorInfo(ERR_TITLE, ERR_CONTENTS);
                        //     // ログ出力
                        //     logicCom.errorLog('OCR結果設定エラー', error);
                        //     logicCom.change2DefaultView(MAIN_PAGE_ID, undefined, SHOOTING_PAGE_ID);
                        //     // カメラプラグイン終了
                        //     AppBizCom.Camera.deinitCamScan((): void => {}, (): void => {});
                        }
                    );
// 01-2022-06-224 本人確認書類撮影画面のガード対応 終了 20221031

                },
                // エラー発生時
                error => {
                    // エラーダイアログを表示する
                    $scope.openErrorInfo(ERR_TITLE, ERR_CONTENTS);
                    // ログ出力
                    logicCom.callbackErrLog(SHOOTING_PAGE_ID, ERR_MODAL_ID, 'カメラOCR撮影エラー');
                    logicCom.change2DefaultView(MAIN_PAGE_ID, undefined, SHOOTING_PAGE_ID);
                    // カメラプラグイン終了
                    AppBizCom.Camera.deinitCamOcr();
                    stopBtnEventFLG = false;
                },
                // キャンセル時
                (): void => {
                    // アクションログ出力
                    logicCom.callbackLog(SHOOTING_PAGE_ID, MAIN_PAGE_ID, 'cancelCallBack', 'カメラOCR撮影キャンセル');
                    logicCom.change2DefaultView(MAIN_PAGE_ID, undefined, SHOOTING_PAGE_ID);
                    stopBtnEventFLG = false;
                },
            );
        };

// 01-2022-06-224 本人確認書類撮影画面のガード対応 開始 20221031
        /**
         * イベント：「書類選択へ戻る」ボタンタップ時
         */
        $scope.backBtnClick = (): void => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            }

            var successCallBack = function () {
                // 申込データ(事務手続き)取得
                var applyInfo: any = AppBizCom.DataHolder.getNotifInfo();

                // 番号確認書類区分が個人番号カードの場合
                if (selectedNumInfo === '1') {
                    // 本人確認書類情報初期化
                    applyInfo.HONIN_KAKNIN_SY_JOHO = {
                        HONIN_KAKNIN_SY_K_1: undefined,
                        HONIN_KAKNIN_SY_YUSO_K_1: undefined,
                        HONIN_KAKNIN_SY_K_2: undefined,
                        HONIN_KAKNIN_SY_YUSO_K_2: undefined
                    }
                }

                // 「OCR結果データ」初期化
                var ocrData: any = AppBizCom.DataHolder.getOcrData();
                ocrData = {
                    MODE: undefined,       // 撮影モード
                    CARD_TYPE: undefined   // カードタイプ
                }
                AppBizCom.DataHolder.setOcrData(ocrData);

                // 遷移フラグの更新
                var flags: any = AppBizCom.DataHolder.getFlowControlFlg();
                if (!flags.CAMERA_FLG_CONTROL) {
                    flags.CAMERA_FLG_CONTROL = {};
                }
                flags.CAMERA_FLG_CONTROL.SKIP_MASK_FLG = false;
                flags.CAMERA_FLG_CONTROL.SKIP_MASK_FLG2 = false;
                AppBizCom.DataHolder.setFlowControlFlg(flags);
            };

            var path: string = '';
            if ($scope.editMode) {
                path = 'selectIdentificationDoc';
            } else {
                // 個人番号カード選択の有無により遷移先変更
                path = selectedNumInfo === '1' ? 'selectNecessaryDoc' : 'selectIdentificationDoc';
            }
            // ログ出力
            var PREV_PAGE_ID: string = selectedNumInfo === '1' ? 'G1100-01' : 'G1140-01';
            logicCom.btnTapLog(MAIN_PAGE_ID, PREV_PAGE_ID, '書類選択へ戻る');
            logicCom.locationPath(path, successCallBack, callbackFLG, connectionErrorCallback);
        };

        /**
         * 本人確認書類カードタイプチェック
         * @param {string} selectHoninKakninCD - アプリ画面で選択した本人確認書類コード
         * @param {string} ocrCardType - OCRが認識した本人確認書類カードタイプ
         * @return チェック結果--true：一致；false：不一致
         */
        var chkCardTypeMatch = function(selectHoninKakninCD, ocrCardType) {
            var ret = true;
            // 本人確認書類コードマスタ
            var idTypes: any = AppBizCom.MstData.getCodeMstDataByKbn('HONIN_KAKNIN_SY');
            // 本人確認書類コード(一部)
            var SELECT_MY_NUMBER: string            = idTypes[0].CD;    // 個人番号カード
            var SELECT_DRIVERS_LICENSE: string      = idTypes[1].CD;    // 運転免許証
            // 選択した本人確認書類とOCR返却カードタイプの一致確認
            if (selectHoninKakninCD === SELECT_MY_NUMBER) {
                ret = ocrCardType === appConst.CARD_TYPE.MY_NUMBER_FRONT;       // 個人番号カード
            } else if (selectHoninKakninCD === SELECT_DRIVERS_LICENSE) {
                ret = ocrCardType === appConst.CARD_TYPE.DRIVERS_LICENSE_FRONT; // 運転免許証
            }
            return ret;
        }
// 01-2022-06-224 本人確認書類撮影画面のガード対応 終了 20221031

        init();
    }]);