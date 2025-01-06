/// <reference path="../reference.d.ts" />
App.controller('startCameraId', ['$scope', '$location', '$controller', '$sce', 'appConst', 'logicCom', 'AppBizCom',
    function ($scope, $location, $controller, $sce, appConst, logicCom, AppBizCom) {

        // 共通部分制御を継承
        $controller('errorInfoModalCtrl', {$scope: $scope});

        // 画面ID定義
        var DISPLAY_MODAL_ID_01: string = 'G1160-01';       // 撮影書面表示画面
        var DISPLAY_MODAL_ID_02: string = 'G1160-02';       // 撮影書面表示（スキップ時）画面
        var ERR_MODAL_ID: string = 'G1020-02';       // エラーモーダル画面

        /**
         * モーダル非表示直後に再表示した場合、背景のぼかし $('body').addClass('is-modal-open') は効かない。
         * 理由はモーダル非表示 $('#id').modal('hide') のぼかし削除 <body class="is-modal-open"> の
         * 発火タイミングが画面レンダリング完了後になるため。class によるスタイル制御を辞め、id に直接スタイルを
         * 書き込む方式で回避。
         */
        var addBlur: () => void = function () {
            $('#main-div-area').css({'filter':'blur(6px)'});
        };

        // ボタン連打防止フラグ
        var inheritStopBtnEventFLG: boolean = false;
        var callbackFLG = function () { };
        // 通信エラー発生する場合、「閉じる」ボタン押下時に、「画面制御 二重制御」フラグを解除する
        var connectionErrorCallback = function () {
            inheritStopBtnEventFLG = false;
        };

        // -----「G1160-01：撮影書面表示画面」イベント-----

        // イベント：初期処理
        $scope.initG1160 = (): void => {
            // イベント登録
            $('#G1160-01').off('show.bs.modal');
            $('#G1160-01').on('show.bs.modal', (): void => {
                $('#G1160-01').off('shown.bs.modal');
                if($('body').hasClass('is-modal-open')) {
                    $('#G1160-01').on('shown.bs.modal', (): void => {
                        $('body').removeClass('is-modal-open');
                        $('body').addClass('is-modal-open');
                    });
                } else {
                    $('body').addClass('is-modal-open');
                }
            });
            $('#G1160-01').on('hidden.bs.modal', (): void => {
                $('body').removeClass('is-modal-open');
            });

            $('#G1160-02').off('show.bs.modal');
            $('#G1160-02').on('show.bs.modal', (): void => {
                $('#G1160-02').off('shown.bs.modal');
                if($('body').hasClass('is-modal-open')) {
                    $('#G1160-02').on('shown.bs.modal', (): void => {
                        $('body').removeClass('is-modal-open');
                        $('body').addClass('is-modal-open');
                    });
                } else {
                    $('body').addClass('is-modal-open');
                }
            });
            $('#G1160-02').on('hidden.bs.modal', (): void => {
                $('body').removeClass('is-modal-open');
            });
            // イベント廃棄
            $scope.$on('$destroy', (): void => {
                $('#G1160-01').off('show.bs.modal');
                $('#G1160-01').off('shown.bs.modal');
                $('#G1160-01').off('hidden.bs.modal');
            });
            $scope.$on('$destroy', (): void => {
                $('#G1160-02').off('show.bs.modal');
                $('#G1160-02').off('shown.bs.modal');
                $('#G1160-02').off('hidden.bs.modal');
            });
        }

        // カメラプラグイン関係エラーメッセージ
        var ERR_TITLE: any = AppBizCom.Msg.getMsg('KKAP-CM000-06E', []);
        var ERR_CONTENTS: any = AppBizCom.Msg.getMsg('KKAP-CM000-07E', []);
        var ERR_LOG_MESSAGE_ID: any = 'KKAP-CM000-07E';

        // カメラスキャン未初期化フラグ
        $scope.noneInitCamFlg = true;
        // カメラOCR未初期化フラグ
        $scope.noneInitCamOcrFlg = true;

        // カメラ初期化
        AppBizCom.Camera.initCamScan(
            // 初期化成功時
            (): void => {
                $scope.noneInitCamFlg = false;
                $scope.$applyAsync();
            },
            // 初期化失敗時
            error => {
                // エラーダイアログを表示する
                $scope.openErrorInfo(ERR_TITLE, ERR_CONTENTS);
                // アプリケーションログ
                logicCom.errorLog('カメラスキャン初期化エラー', error);
                // カメラプラグイン終了
                AppBizCom.Camera.deinitCamScan((): void => {}, (): void => {});
            }
        );

        // ocr 初期化
        AppBizCom.Camera.initCamOcr(
            // 初期化成功時
            ():void => {
                $scope.noneInitCamOcrFlg = false;
                $scope.$applyAsync();
            },
            // 初期化失敗時
            error => {
                // エラーダイアログを表示する
                $scope.openErrorInfo(ERR_TITLE, ERR_CONTENTS);
                // アプリケーションログ
                logicCom.errorLog('カメラOCR初期化エラー', error);
                // カメラプラグイン終了
                AppBizCom.Camera.deinitCamOcr((): void => {}, (): void => {});
            }
        );

        // メッセージ定義
        var TITLE_MESSAGE_ID: string = 'KKAP-SF011-01I';
        var BACK_SKIP_MESSAGE_ID: string = 'KKAP-SF011-02I';
        var SKIP_MESSAGE_ID: string = 'KKAP-SF011-03I';
        var BOOK_FRONT_MESSAGE_ID: string = 'KKAP-SF011-04I';
        var BOOK_BACK_MESSAGE_ID: string = 'KKAP-SF011-05I';

        // 遷移先定義
        var URL_FRONT_RESULT: string = 'cameraIdFrontResult';
        var URL_BACK_RESULT: string = 'cameraIdBackResult';
        var URL_THIRD_RESULT: string = 'cameraIdThirdResult';

        // 画面IDなどの設定用変数
        var startCameraPageId: string = '';
        var cameraShootingId: string = 'G1170-01';
        var cameraResultId: string = '';
        // 「G1160-01:撮影書面表示画面」/「G1160-02:撮影書面表示(スキップ時)画面」への遷移元画面id
        var prevPageId: string = '';
        // 撮影対象書面
        var targetIdentity: number = 0; // 1: １種類目 //2: ２種類目

        // 「G117-01:カメラ撮影画面」への遷移元画面id
        var nextPath: string = '';
        var displayType:string = '';

        // 共通領域の保存先設定
        var targetItem: string = '';

        var personDocInfo: any = null;

        // 冊子型判定初期化
        $scope.isBookFlg = false;
        // パスポート判定初期化
        $scope.isPassportFlg = false;

        // 撮影ガイド種類初期化
        $scope.guideType = '';

        /**
         * 撮影書面表示画面　初期処理（呼び出し元で表示前処理）
         * @param  {number} identityNum - 表示する選択書類（1種類目 or 2種類目）
         * @param  {string} from - 遷移元画面ID
         * @param  {string} targetPageId - 撮影書面表示画面ID（G1160-01 or G1160-02）
         * @returns void
         */
        $scope.initIdentityDocInfo = (identityNum: number, from: string,  targetPageId: string): void => {
            targetIdentity = identityNum;
            prevPageId = from;
            startCameraPageId = targetPageId;
            // 申込データ(事務手続き)取得
            var info: any = AppBizCom.DataHolder.getNotifInfo();
            // 表示用に対象書類情報を取得
            personDocInfo = AppBizCom.MstData.getCodeMstDataByCd('HONIN_KAKNIN_SY', info.HONIN_KAKNIN_SY_JOHO['HONIN_KAKNIN_SY_K_' + targetIdentity.toString()]);
            var kind: string = '';

            // 本人確認書類の情報が取得できないときは処理しない
            if (typeof(personDocInfo) == 'undefined' || JSON.stringify(personDocInfo) == '{}') {
                $scope.titleG1160 = '';
                $scope.kind = '';
                return;
            }

            // 各種福祉手帳か判定
            $scope.isBookFlg = personDocInfo.CD === '06' ? true : false;
            // パスポートか判定
            $scope.isPassportFlg = personDocInfo.CD === '03' ? true : false;

            // 撮影面
            var surfaceG1160: string = appConst.CAM_DISPLAY_MODAL.FRONT_NAME;

            // 表示する画像パターン、ログ出力用画面ID取得
            // 1枚目設定
            if ($scope.popupMode === 'FRONT') {
                // サンプル画像設定
                kind = personDocInfo.STM3[0]; // 補足情報3 1桁目
                // 表面/1枚目設定(パスポート、印鑑証明書除く)
                if (personDocInfo.STM3 && personDocInfo.STM3.length < 3 && personDocInfo.CD !== '03' && personDocInfo.CD !== '13') {
                    // （表面）設定
                    displayType = appConst.CAM_TITLE_SUFF.FRONT_NAME;
                    surfaceG1160 = appConst.CAM_DISPLAY_MODAL.FRONT_NAME;
                    // 冊子型書面用メッセージ設定
                    if ($scope.isBookFlg) {
                        var bookMessage: string = AppBizCom.Msg.getMsg(BOOK_FRONT_MESSAGE_ID, []);
                        $scope.bookFrontMessage = $sce.trustAsHtml(bookMessage);
                    }
                } else {
                    // （1枚目）設定
                    displayType = appConst.CAM_TITLE_SUFF.FIRST_NAME;
                    surfaceG1160 = appConst.CAM_DISPLAY_MODAL.FIRST_NAME;
                }
                // 撮影後の遷移先設定
                cameraResultId = 'G1180-01';
                nextPath = URL_FRONT_RESULT;
            // 2枚目設定
            } else if ($scope.popupMode === 'BACK') {
                // サンプル画像設定
                kind = personDocInfo.STM3[1]; // 補足情報3 2桁目
                // 裏面/2枚目設定 (パスポート、印鑑証明書除く)
                if (personDocInfo.STM3 && personDocInfo.STM3.length < 3 && personDocInfo.CD !== '03' && personDocInfo.CD !== '13') {
                    // （裏面）設定
                    displayType = appConst.CAM_TITLE_SUFF.BACK_NAME;
                    surfaceG1160 = appConst.CAM_DISPLAY_MODAL.BACK_NAME;
                    // スキップ案内設定
                    var backSkipMessage: string = AppBizCom.Msg.getMsg(BACK_SKIP_MESSAGE_ID, [personDocInfo.MSY]);
                    $scope.skipMessage = $sce.trustAsHtml(backSkipMessage);
                    // 冊子型書面用メッセージ設定
                    if ($scope.isBookFlg) {
                        var bookMessage: string = AppBizCom.Msg.getMsg(BOOK_BACK_MESSAGE_ID, []);
                        $scope.bookBackMessage = $sce.trustAsHtml(bookMessage);
                    }
                } else {
                    // （2枚目）設定
                    displayType = appConst.CAM_TITLE_SUFF.SECOND_NAME;
                    surfaceG1160 = appConst.CAM_DISPLAY_MODAL.SECOND_NAME;
                    // スキップ案内設定
                    var skipMessage: string = AppBizCom.Msg.getMsg(SKIP_MESSAGE_ID, [surfaceG1160]);
                    $scope.skipMessage = $sce.trustAsHtml(skipMessage);
                }
                // 撮影後の遷移先設定
                cameraResultId = 'G1180-02';
                nextPath = URL_BACK_RESULT;
            // 3枚目設定
            } else if ($scope.popupMode == "THIRD") {
                cameraResultId = 'G1180-03';
                // サンプル画像設定
                kind = personDocInfo.STM3[2]; // 補足情報3 2桁目
                // （3枚目）設定
                displayType = appConst.CAM_TITLE_SUFF.THIRD_NAME;
                surfaceG1160 = appConst.CAM_DISPLAY_MODAL.THIRD_NAME;
                // スキップ案内設定
                var skipMessage: string = AppBizCom.Msg.getMsg(SKIP_MESSAGE_ID, [surfaceG1160]);
                $scope.skipMessage = $sce.trustAsHtml(skipMessage);
                // 撮影後の遷移先設定
                cameraResultId = 'G1180-03';
                nextPath = URL_THIRD_RESULT;
            }
            // タイトル設定
            var titleParamG1160: string = personDocInfo.MSY + 'の<span class="strong">' + surfaceG1160 + '</span>';
            $scope.titleG1160 = $sce.trustAsHtml(AppBizCom.Msg.getMsg(TITLE_MESSAGE_ID, [titleParamG1160]));
            // サンプル画像設定
            var imageType: any = AppBizCom.MstData.getCodeMstDataByCd('HONNIN_KAKNN_GAZO', kind);
            $scope.kind = imageType.STM1.replace('.svg', '');

            // 保存先設定
            if (targetIdentity === 1) {
                if ($scope.popupMode === 'FRONT') {
                    targetItem = 'HONIN_KAKNIN_SY1_GAZO1'; // 本人確認書類1種類目画像1
                } else if ($scope.popupMode === 'BACK'){
                    targetItem = 'HONIN_KAKNIN_SY1_GAZO2'; // 本人確認書類1種類目画像2
                } else {
                    targetItem = 'HONIN_KAKNIN_SY1_GAZO3'; // 本人確認書類1種類目画像3
                }
            } else if(targetIdentity === 2){
                if ($scope.popupMode === 'FRONT') {
                    targetItem = 'HONIN_KAKNIN_SY2_GAZO1'; // 本人確認書類2種類目画像1
                } else if ($scope.popupMode === 'BACK'){
                    targetItem = 'HONIN_KAKNIN_SY2_GAZO2'; // 本人確認書類2種類目画像2
                } else {
                    targetItem = 'HONIN_KAKNIN_SY2_GAZO3'; // 本人確認書類2種類目画像3
                }
            }
            $scope.$applyAsync();
        };

        // カメラ撮影処理
        var takePicModeScan = (): void => {
            // 「G1170-01:カメラ撮影（本人確認書類）画面」表示
            $scope.cameraTitle = personDocInfo.MSY + displayType;
            logicCom.change2CameraPreview(prevPageId, startCameraPageId, cameraShootingId);
            // カメラスキャン起動
            AppBizCom.Camera.startCamScan(
                // 撮影成功時
                camInfo => {

                    // 共通領域へ保存
                    var imageData: any = AppBizCom.DataHolder.getImageData();

                    // データがないとき初期設定する
                    if(!imageData){
                        imageData = {};
                    }
                    // 画像データ設定
                    imageData[targetItem] = camInfo.image;
                    AppBizCom.DataHolder.setImageData(imageData);

                    // 運転免許証（裏面）自動マスク処理
                    if (personDocInfo.CD === '02' && camInfo.mode === 1) {
                        logicCom.autoMask(2, 2);
                    } 

                    // 画面遷移
                    if ($location.path() != ("/" + nextPath)) {
                        logicCom.change2DefaultView(prevPageId, undefined, cameraShootingId);
                        $scope.$applyAsync();

                        // ログ出力
                        logicCom.callbackLog(cameraShootingId, cameraResultId, 'カメラ撮影成功');
                        // 次画面へ遷移
                        logicCom.locationPath(nextPath, callbackFLG, callbackFLG, function () {
                            $('#' + DISPLAY_MODAL_ID_01).modal('hide');
                            connectionErrorCallback();
                        });
                    // 同一画面への遷移の場合
                    } else {
                        // ログ出力
                        logicCom.callbackLog(cameraShootingId, prevPageId, 'カメラ撮影成功');
                        // 呼び出し元画面再表示
                        logicCom.change2DefaultView(prevPageId, undefined, cameraShootingId);
                        inheritStopBtnEventFLG = false;
                        $scope.reloadPage();
                    }

                    $scope.$applyAsync();
                },
                // エラー発生時
                error => {
                    // ログ出力
                    logicCom.callbackErrLog(cameraShootingId, ERR_MODAL_ID, 'カメラ撮影エラー');
                    // エラーダイアログを表示する
                    $scope.openErrorInfo(ERR_TITLE, ERR_CONTENTS);
                    // 呼び出し元画面再表示
                    logicCom.change2DefaultView(prevPageId, startCameraPageId, cameraShootingId);
                    // カメラプラグイン終了
                    AppBizCom.Camera.deinitCamScan((): void => {}, (): void => {});
                    inheritStopBtnEventFLG = false;
                },
                // キャンセル時
                (): void => {
                    // ログ出力
                    logicCom.callbackLog(cameraShootingId, startCameraPageId, 'cancelCallBack', 'カメラ撮影キャンセル');
                    // 呼び出し元画面再表示
                    logicCom.change2DefaultView(prevPageId, startCameraPageId, cameraShootingId);
                    inheritStopBtnEventFLG = false;
                },
            );
        };

        // カメラOCR撮影処理
        var takePicModeOcr = (): void => {
            // 「G1170-01:カメラ撮影（本人確認書類）画面」表示
            $scope.cameraTitle = personDocInfo.MSY + displayType;
            logicCom.change2CameraPreview(prevPageId, startCameraPageId, cameraShootingId);
            // カメラOCR起動
            AppBizCom.Camera.startCamOcr(
                // 撮影成功時
                camInfo => {
                    // 共通領域へ保存
                    var imageData: any = AppBizCom.DataHolder.getImageData();

                    // データがないとき初期設定する
                    if(!imageData){
                        imageData = {};
                    }
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
                    }

                    // 共通領域へ保存する
                    // logicCom.setOcrResult2DataHolder(camInfo, 
// 01-2022-06-224 本人確認書類撮影画面のガード対応 開始 20221031
                    logicCom.setOcrResult2DataHolderJimu(camInfo, 
                        (): void => {
// 01-2022-06-224 本人確認書類撮影画面のガード対応 終了 20221031
                            // 成功時画面遷移
                            if ($location.path() != ("/" + nextPath)) {
                                logicCom.change2DefaultView(prevPageId, undefined, cameraShootingId);
                                $scope.$applyAsync();
                                // ログ出力
                                logicCom.callbackLog(cameraShootingId, cameraResultId, 'カメラOCR撮影成功');
                                // 次画面へ遷移
                                logicCom.locationPath(nextPath, callbackFLG, callbackFLG, function () {
                                    $('#' + DISPLAY_MODAL_ID_01).modal('hide');
                                    connectionErrorCallback();
                                });
                            } else {
                                // ログ出力
                                logicCom.callbackLog(cameraShootingId, prevPageId, 'カメラOCR撮影成功');
                                // 呼び出し元画面再表示
                                logicCom.change2DefaultView(prevPageId, undefined, cameraShootingId);
                                inheritStopBtnEventFLG = false;
                                $scope.reloadPage();
                            }
// 01-2022-06-224 本人確認書類撮影画面のガード対応 開始 20221031
                        // },
                        // error => {
                        //     // 失敗時
                        //     // エラーダイアログを表示する
                        //     $scope.openErrorInfo(ERR_TITLE, ERR_CONTENTS);
                        //     // ログ出力
                        //     logicCom.errorLog('OCR結果設定エラー', error);
                        //     // 呼び出し元画面再表示
                        //     logicCom.change2DefaultView(prevPageId, startCameraPageId, cameraShootingId);
                        //     // カメラプラグイン終了
                        //     AppBizCom.Camera.deinitCamOcr((): void => {}, (): void => {});
                        }
                    );
// 01-2022-06-224 本人確認書類撮影画面のガード対応 終了 20221031
                },
                // エラー発生時
                error => {
                    // ログ出力
                    logicCom.callbackErrLog(cameraShootingId, ERR_MODAL_ID, 'カメラOCR撮影エラー');
                    // エラーダイアログを表示する
                    $scope.openErrorInfo(ERR_TITLE, ERR_CONTENTS);
                    // 呼び出し元画面再表示
                    logicCom.change2DefaultView(prevPageId, startCameraPageId, cameraShootingId);
                    // カメラプラグイン終了
                    AppBizCom.Camera.deinitCamOcr((): void => {}, (): void => {});
                    inheritStopBtnEventFLG = false;
                },
                // キャンセル時
                (): void => {
                    // ログ出力
                    logicCom.callbackLog(cameraShootingId, startCameraPageId, 'カメラOCR撮影キャンセル');
                    // 呼び出し元画面再表示
                    logicCom.change2DefaultView(prevPageId, startCameraPageId, cameraShootingId);
                    inheritStopBtnEventFLG = false;
                },
            );
        };

        // 撮影開始ボタン
        $scope.btnTakePictStartClick = (): void => {
            // ダブルタップ対応
            if (inheritStopBtnEventFLG) {
                return;
            } else {
                inheritStopBtnEventFLG = true;
            }

            logicCom.btnTapLog(startCameraPageId, cameraShootingId, "撮影開始");

            // カメラガイド設定
            $scope.guideType = personDocInfo.CD;
            // OCR対象書面判定
            if ($scope.popupMode === 'FRONT') {
                if (personDocInfo.CD === '01' || // 個人番号カード（表面）
                    personDocInfo.CD === '02' || // 運転免許証（表面）
                    personDocInfo.CD === '04' || // 在留カード（表面）
                    personDocInfo.CD === '05' ) { // 特別永住者証明書（表面）
                    
                    takePicModeOcr();  // OCR撮影
                } else {                    
                    takePicModeScan(); // スキャン撮影
                }
            } else {
                takePicModeScan();     // スキャン撮影
            }
        };

        // 戻るボタン
        $scope.G1160BtnBackClick = (): void => {
            // ダブルタップ対応
            if (inheritStopBtnEventFLG) {
                return;
            } else {
                inheritStopBtnEventFLG = true;
            }

            logicCom.btnTapLog(startCameraPageId, prevPageId, '戻る');
            $('#' + startCameraPageId).modal('hide');

            inheritStopBtnEventFLG = false;
        };

        // スキップボタンクリック
        $scope.skipBtnClick = (): void => {
            // ダブルタップ対応
            if (inheritStopBtnEventFLG) {
                return;
            } else {
                inheritStopBtnEventFLG = true;
            }

            // スキップ先の判断のため、１種類目、２種類目両方の情報を取得
            // 申込データ(事務手続き)取得
            var info: any = AppBizCom.DataHolder.getNotifInfo();
            var selectedInfo: any = info.HONIN_KAKNIN_SY_JOHO

            // １種類目でスキップした時
            if (targetIdentity === 1) {
                // ２種類目の撮影がない場合、「G1190-01:撮影結果確認（1種類目）画面」へ遷移
                if (selectedInfo.HONIN_KAKNIN_SY_YUSO_K_2 !== '1') {
                    logicCom.btnTapLog(DISPLAY_MODAL_ID_01, 'G1190-01', 'スキップ');
                    $('#' + DISPLAY_MODAL_ID_01).modal('hide');
                    $('body').removeClass('is-modal-open');
                    logicCom.locationPath('ocrIdResult', callbackFLG, addBlur, connectionErrorCallback);
                    $scope.$applyAsync();
                // ２種類目を撮影する場合「G1160-02:撮影書面表示（スキップ時）画面」表示
                } else {
                    logicCom.btnTapLog(DISPLAY_MODAL_ID_01, DISPLAY_MODAL_ID_02, 'スキップ');
                    $scope.popupMode = 'FRONT';
                    $scope.initIdentityDocInfo(2, prevPageId , DISPLAY_MODAL_ID_02);
                    $('#' + DISPLAY_MODAL_ID_01).modal('hide');
                    $('#' + DISPLAY_MODAL_ID_02).modal('show');
                    inheritStopBtnEventFLG = false;
                }
            // 2種類目でスキップした時
            } else if(targetIdentity === 2){
                // 1種類目撮影済みの場合
                if (selectedInfo.HONIN_KAKNIN_SY_YUSO_K_1 === '1') {
                    // 「G1190-01:撮影結果確認（1種類目）画面」へ遷移
                    logicCom.btnTapLog(DISPLAY_MODAL_ID_01, 'G1190-01', 'スキップ');
                    $('#' + DISPLAY_MODAL_ID_01).modal('hide');
                    $('body').removeClass('is-modal-open');
                    logicCom.locationPath('ocrIdResult', callbackFLG, addBlur, connectionErrorCallback);
                    $scope.$applyAsync();
                } else {
                    // 「G1190-02:撮影結果確認（2種類目）画面」へ遷移
                    logicCom.btnTapLog(DISPLAY_MODAL_ID_01, 'G1190-02', 'スキップ');
                    $('#' + DISPLAY_MODAL_ID_01).modal('hide');
                    $('body').removeClass('is-modal-open');
                    logicCom.locationPath('ocrId2Result', callbackFLG, addBlur, connectionErrorCallback);
                    $scope.$applyAsync();
                }
            }
        };
    }]);
