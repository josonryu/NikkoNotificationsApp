/// <reference path="../reference.d.ts" />
declare var Swiper: any;

App.controller('ocrId2ResultController', ['$scope', '$controller', 'appConst', 'AppBizCom', 'logicCom', '$anchorScroll', '$timeout',
    function ($scope, $controller, appConst, AppBizCom, logicCom, $anchorScroll, $timeout) {

        // エラーモーダル用共通コントローラ
        $controller('errorInfoModalCtrl', {$scope: $scope});

        // 画面ID定義
        var MAIN_PAGE_ID: string = 'G1190-02';
        var SHOOTING_PAGE_ID: string = 'G1170-01';
        var EXPANTION_PAGE_ID: string = 'G1200-01';
        var CONFIRM_MODAL_ID: string = 'G1190-03';
        var FILL_PAGE_ID: string = 'G1210-01';
        var ERR_MODAL_ID: string = 'G1020-02';       // エラーモーダル画面

        // ボタン連打防止フラグ
        var stopBtnEventFLG: boolean = false;
        var callbackFLG = function () { };
        // 通信エラー発生する場合、「閉じる」ボタン押下時に、「画面制御 二重制御」フラグを解除する
        var connectionErrorCallback = function () {
            stopBtnEventFLG = false;
        };

        // スクロールロック
        var scrollLock = function () {
            $('.scrollArea').css({ '-webkit-overflow-scrolling': 'auto' });
        };
        // スクロールアンロック
        var scrollUnlock = function () {
            $('.scrollArea').css({ '-webkit-overflow-scrolling': 'touch' });
        };

        // エラーモーダル用イベント登録
        $('#' + ERR_MODAL_ID).on('show.bs.modal', (): void => {
            $('#' + ERR_MODAL_ID).off('shown.bs.modal');
            if ($('body').hasClass('is-modal-open')) {
                $('#' + ERR_MODAL_ID).on('shown.bs.modal', (): void => {
                    $('body').removeClass('is-modal-open');
                    $('body').addClass('is-modal-open');
                });
            } else {
                $('body').addClass('is-modal-open');
            }   
        });

        // エラーモーダル用イベント廃棄
        $scope.$on('$destroy', (): void => {
            $('#' + ERR_MODAL_ID).off('show.bs.modal');
            $('#' + ERR_MODAL_ID).off('shown.bs.modal');
        });

        $scope.initConfirm = (): void => {
            // イベント登録
            $('#' + CONFIRM_MODAL_ID).on('show.bs.modal', (): void => {
                $('body').addClass('is-modal-open');
            });
            $('#' + CONFIRM_MODAL_ID).on('hidden.bs.modal', (): void => {
                $('body').removeClass('is-modal-open');
            });

            // イベント廃棄
            $scope.$on('$destroy', (): void => {
                $('#' + CONFIRM_MODAL_ID).off('show.bs.modal');
                $('#' + CONFIRM_MODAL_ID).off('hidden.bs.modal');
            });
        }
        
        // エラーモーダル用
        var ERR_LOG_MESSAGE_ID: string = 'KKAP-CM000-07E';
        var ERR_TITLE: string = AppBizCom.Msg.getMsg('KKAP-CM000-06E', []);
        var ERR_CONTENTS: string = AppBizCom.Msg.getMsg('KKAP-CM000-07E', []);

        // 申込データ(事務手続き)取得
        var info: any = AppBizCom.DataHolder.getNotifInfo();
        var selectedInfo: any = info.HONIN_KAKNIN_SY_JOHO
        // 本人確認書類データ取得
        var personDocInfos: any = AppBizCom.MstData.getCodeMstDataByCd('HONIN_KAKNIN_SY', selectedInfo.HONIN_KAKNIN_SY_K_2);
        
        // 塗りつぶし対象書面フラグ
        var isFillImage: boolean = false;
        // 塗りつぶし画面スキップフラグ
        var skipMaskFlg: boolean = false;
        var skipMaskFlg2: boolean = false;
        // // 自動マスク画像情報の有無
        $scope.isAutoFillFrontImage = false;
        $scope.isAutoFillBackImage = false;
        $scope.isAutoFillImage = false;
        // 自動マスク画像表示/非表示
        $scope.showAutoFillFrontImage = false;
        $scope.showAutoFillBackImage = false;
        // スイッチコントロール初期状態
        $scope.switch = false;

        var BASE64_HEAD: string = 'data:image/jpeg;base64,';
        var BASE64_HEAD_PNG: string = 'data:image/png;base64,';

        // 自動塗りつぶし画像設定処理
        var setImages = ():void => {
            // 共通領域定義 撮影画像データ取得
            var comDataPhotoData = AppBizCom.DataHolder.getImageData();

            // 【表面】
            $scope.frontImageExist = true;
            // 撮影画像をセット
            $scope.idDocFrontimg = 'data:image/jpeg;base64,' + comDataPhotoData.HONIN_KAKNIN_SY2_GAZO1;
            
            // 【裏面】
            // 裏面画像存在確認
            if (typeof (comDataPhotoData.HONIN_KAKNIN_SY2_GAZO2) != 'undefined') {
                $scope.backImageExist = true;
                // 撮影画像をセット
                $scope.idDocBackimg = 'data:image/jpeg;base64,' + comDataPhotoData.HONIN_KAKNIN_SY2_GAZO2;
            }
            
            // 【3枚目】
            // 3枚目画像存在確認
            if (typeof (comDataPhotoData.HONIN_KAKNIN_SY2_GAZO3) != 'undefined') {
                $scope.thirdImageExist = true;
                // 撮影画像をセット
                $scope.idDocThirdimg = 'data:image/jpeg;base64,' + comDataPhotoData.HONIN_KAKNIN_SY2_GAZO3;
            }
        }

        // 初期処理
        var init = (): void => {
            $scope.appConst = appConst;
            // 初期表示設定
            $scope.title = personDocInfos.MSY;
            $scope.frontImageExist = true;
            // 遷移元により遷移先変更
            var flags: any = AppBizCom.DataHolder.getFlowControlFlg();
            if (!flags.CAMERA_FLG_CONTROL) {
                flags.CAMERA_FLG_CONTROL = {};
            }
            $scope.editMode = flags.CAMERA_FLG_CONTROL.MOD_FLG;
            skipMaskFlg = flags.CAMERA_FLG_CONTROL.SKIP_MASK_FLG;
            skipMaskFlg2 = flags.CAMERA_FLG_CONTROL.SKIP_MASK_FLG2;

            if (skipMaskFlg) {
                //ルーティング情報削除
                AppBizCom.DataHolder.deleteRouteInfoByPath('cameraIdFill');
            }

            // パンくずの表示パターン
            $scope.pankuzuPatten = $scope.editMode ? '4' : '3';

            // 表示モード設定
            $scope.isSwiperMode = personDocInfos.STM3.length >= 3;

            // 共通領域定義 撮影画像データ取得
            var comDataPhotoData: any = AppBizCom.DataHolder.getImageData();

            // 「書類選択へ戻る」ボタン表示処理
            $scope.btnBackDisplay = comDataPhotoData.HONIN_KAKNIN_SY1_GAZO1 ? true : false;
            
            // 手動塗りつぶし対象書面判定
            if (personDocInfos.CD === '07' || // その他１（顔写真あり）
                personDocInfos.CD === '12' ||  // 住民票
                personDocInfos.CD === '14' ||  // その他１（顔写真なし）
                personDocInfos.CD === '15') {  // その他２（顔写真なし）
                isFillImage = true;
            }

            // 塗りつぶし対象書面でない且つ、確認画面からの遷移の場合true(「確認画面へ」)
            $scope.btnDisplay = isFillImage ? false : $scope.editMode;

            // 次へボタンは非活性
            $scope.btnNextDisabled = true;
            $scope.checkboxConfirm1 = false;
            $scope.checkboxConfirm2 = false;
            $scope.checkboxConfirm3 = false;

            // 画像セット
            setImages();

            // 撮影開始画面指定
            $scope.noneInitCamFlg = true;
            $scope.noneInitCamOcrFlg = false;

            // カメラ初期化
            AppBizCom.Camera.initCamScan(
                // 初期化成功時
                (): void =>  {
                    // 初期化成功した場合は false
                    $scope.noneInitCamFlg = false;
                    $scope.$applyAsync();
                },
                // 初期化失敗時
                error => {
                    // エラーダイアログを表示する
                    $scope.openErrorInfo(ERR_TITLE, ERR_CONTENTS);
                    // ログ出力
                    logicCom.errorLog('カメラ初期化エラー', error);
                    // カメラプラグイン終了
                    AppBizCom.Camera.deinitCamScan((): void => { }, (): void => { });
                }
            );
        }

        // -----「G1190-01:撮影結果確認（1種類目）画面」イベント-----

        // イベント：初期処理
        $scope.init = (): void => {
            //画面描画後にスクロールリセット
            $scope.$on('$viewContentLoaded', function () {
                $timeout(function () {
                    $anchorScroll.yOffset = 0;
                    $anchorScroll();
                    $scope.initSwiper();
                    scrollUnlock();
                }, 10);
            });
        };

        // イベント：横スクロール設定
        $scope.initSwiper = (): void => {
            var galleryThumbs: any = new Swiper('.gallery-thumbs', {
                slidesPerView: 0,
                watchSlidesVisibility: true,
            });
            var galleryTop: any = new Swiper('.gallery-top', {
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                thumbs: {
                    swiper: galleryThumbs
                }
            });
        }

        /**
         * イベント：「再撮影」ボタンタップ時
         */
        $scope.takeRetry = target => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            }

            // 「G1170-01：カメラ撮影（本人確認書類）画面」表示設定
            // 撮影ガイド設定（顔写真位置）
            $scope.guideType = personDocInfos.CD;

            // タイトル設定
            var titleSuffix: string = '';
            var targetItem: string = '';
            if (target == 'front') {
                $scope.popupMode = 'FRONT';
                if (personDocInfos.STM3 && personDocInfos.STM3.length < 3 && personDocInfos.CD !== '03' && personDocInfos.CD !== '13') {
                    titleSuffix = appConst.CAM_TITLE_SUFF.FRONT_NAME;
                } else {
                    titleSuffix = appConst.CAM_TITLE_SUFF.FIRST_NAME;
                }
                targetItem = 'HONIN_KAKNIN_SY2_GAZO1';
            } else if (target == 'back') {
                $scope.popupMode = 'BACK';
                if (personDocInfos.STM3 && personDocInfos.STM3.length < 3 && personDocInfos.CD !== '03' && personDocInfos.CD !== '13') {
                    titleSuffix = appConst.CAM_TITLE_SUFF.BACK_NAME;
                } else {
                    titleSuffix = appConst.CAM_TITLE_SUFF.SECOND_NAME;
                }
                targetItem = 'HONIN_KAKNIN_SY2_GAZO2';
            } else if (target == 'third') {
                $scope.popupMode = 'THIRD';
                titleSuffix = appConst.CAM_TITLE_SUFF.THIRD_NAME;
                targetItem = 'HONIN_KAKNIN_SY2_GAZO3';
            }
            $scope.cameraTitle = personDocInfos.MSY + ' ' + titleSuffix;
            
            // ログ出力
            logicCom.btnTapLog(MAIN_PAGE_ID, SHOOTING_PAGE_ID, '再撮影');
            // 「G1170-01：カメラ撮影（本人確認書類）画面」表示
            logicCom.change2CameraPreview(MAIN_PAGE_ID, undefined, SHOOTING_PAGE_ID);

            
            AppBizCom.Camera.startCamScan(
                // 撮影成功時
                camInfo => {
                    
                    // 共通領域へ保存
                    var imageData = AppBizCom.DataHolder.getImageData();

                    // 画像データ設定
                    imageData[targetItem] = camInfo.image;
                    AppBizCom.DataHolder.setImageData(imageData);

                    // フラグ情報更新
                    var flags: any = AppBizCom.DataHolder.getFlowControlFlg();
                    flags.CAMERA_FLG_CONTROL.SKIP_MASK_FLG2 = false;
                    AppBizCom.DataHolder.setFlowControlFlg(flags);
                    skipMaskFlg2 = flags.CAMERA_FLG_CONTROL.SKIP_MASK_FLG2;

                    // 再撮影を反映
                    if (target === 'front') {
                        $scope.idDocFrontimg = 'data:image/jpeg;base64,' + camInfo.image;
                        $scope.frontImageExist = true;
                    } else if (target === 'back') {
                        $scope.idDocBackimg = 'data:image/jpeg;base64,' + camInfo.image;
                        $scope.backImageExist = true;
                    } else {
                        $scope.idDocThirdimg = 'data:image/jpeg;base64,' + camInfo.image;
                        $scope.thirdImageExist = true;
                    }

                    // 画面更新
                    setImages();
                    $scope.btnNextDisabled = true;
                    $scope.checkboxConfirm1 = false;
                    $scope.checkboxConfirm2 = false;
                    $scope.checkboxConfirm3 = false;
                    $scope.$applyAsync();
                    // ログ出力
                    logicCom.callbackLog(SHOOTING_PAGE_ID, MAIN_PAGE_ID, 'カメラ撮影成功');
                    logicCom.change2DefaultView(MAIN_PAGE_ID, undefined, SHOOTING_PAGE_ID);
                    stopBtnEventFLG = false;
                },
                // エラー発生時
                error =>  {
                    // エラーダイアログを表示する
                    $scope.openErrorInfo(ERR_TITLE, ERR_CONTENTS);
                    // アクションログ出力
                    logicCom.callbackErrLog(SHOOTING_PAGE_ID, MAIN_PAGE_ID, 'カメラ撮影エラー');
                    logicCom.change2DefaultView(MAIN_PAGE_ID, undefined, SHOOTING_PAGE_ID);
                    // カメラプラグイン終了
                    AppBizCom.Camera.deinitCamScan((): void => {}, (): void => {});
                    stopBtnEventFLG = false;
                },
                // キャンセル時
                (): void => {
                    // アクションログ出力
                    logicCom.callbackLog(SHOOTING_PAGE_ID, MAIN_PAGE_ID, 'cancellCallBack', 'カメラ撮影キャンセル');
                    logicCom.change2DefaultView(MAIN_PAGE_ID, undefined, SHOOTING_PAGE_ID);
                    stopBtnEventFLG = false;
                },
            );
        };

         /**
         * イベント：確認チェックボックスタップ時
         */
        $scope.$watch('[checkboxConfirm1,checkboxConfirm2]', val => {
            var btnNextDisabled: boolean = true;
            if (val[0] && val[1]) {
                btnNextDisabled = false;
            }
            $scope.btnNextDisabled = btnNextDisabled;
            $scope.$applyAsync();
        });

        /**
         * イベント：「戻る」ボタンタップ時
         */
        $scope.backBtnClick = (): void => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            }

            if ($scope.btnBackDisplay) {
                // アクションログ出力
                logicCom.btnTapLog(MAIN_PAGE_ID, 'G1190-01', '戻る');
                var path:string = AppBizCom.DataHolder.getPrevRoutePath();
                logicCom.locationPath(path, callbackFLG, callbackFLG, connectionErrorCallback);
            } else {
                // アクションログ出力
                logicCom.btnTapLog(MAIN_PAGE_ID, CONFIRM_MODAL_ID, '書類選択へ戻る');
                // モーダル表示
                $('#' + CONFIRM_MODAL_ID).modal('show');
                stopBtnEventFLG = false;
            }
        };

        // イベント：「次へ」ボタンタップ時
        $scope.nextBtnClick = (): void => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            }

            // 申込データ（事務手続き）更新
            var info: any = AppBizCom.DataHolder.getNotifInfo();
            if (!info.KAKNIN_SY_CHK_JOHO) {
                info.KAKNIN_SY_CHK_JOHO = {};
            }
            info.KAKNIN_SY_CHK_JOHO.HONIN_KAKNIN_SY2_YMTR_K = $scope.checkboxConfirm1 === 1 ? '1' : '0';
            info.KAKNIN_SY_CHK_JOHO.HONIN_KAKNIN_SY2_UTRK_K = $scope.checkboxConfirm2 === 1 ? '1' : '0';
            info.KAKNIN_SY_CHK_JOHO.HONIN_KAKNIN_SY2_SINKYU_K = undefined;
            AppBizCom.DataHolder.setNotifInfo(info);

            // ログ出力用入力項目収集
            var btnName: string = $scope.btnDisplay ? '確認画面へ' : '次へ';
            info = AppBizCom.DataHolder.getNotifInfo();
            var checkedInfo: any = info.KAKNIN_SY_CHK_JOHO;
            var result: any = {
                'HONIN_KAKNIN_SY2_YMTR_K': {'value': checkedInfo.HONIN_KAKNIN_SY2_YMTR_K},
                'HONIN_KAKNIN_SY2_UTRK_K': {'value': checkedInfo.HONIN_KAKNIN_SY2_UTRK_K},
            };
            result.HONIN_KAKNIN_SY2_SINKYU_K = {'value': checkedInfo.HONIN_KAKNIN_SY2_SINKYU_K};

            // 塗りつぶし対象書面選択時
            if (isFillImage && !skipMaskFlg2) {
                // ログ出力
                logicCom.btnTapLog(MAIN_PAGE_ID, FILL_PAGE_ID, btnName, result);
                // 塗りつぶし画面へ遷移
                logicCom.locationPath('cameraIdFill', callbackFLG, callbackFLG, connectionErrorCallback);
            // 修正時
            } else if ($scope.editMode) {
                // ログ出力
                logicCom.btnTapLog(MAIN_PAGE_ID, 'G1240-01', btnName, result);
                logicCom.locationPath('applicationConfirm', callbackFLG, callbackFLG, connectionErrorCallback);
            // 通常時
            } else {
                // ログ出力
                logicCom.btnTapLog(MAIN_PAGE_ID, 'G1220-01', btnName, result);
                logicCom.locationPath('applicationConfirmStart', callbackFLG, callbackFLG, connectionErrorCallback);
            }
        };

        /**
         * イベント：「画像拡大」ボタンタップ時
         */
        $scope.imgExpansion = target => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            }

            $scope.frontBack = target;
            $scope.exAutoFillImage = false;
            //  画像の高さ、幅
            var imgHeight: number = undefined;
            var imgWidth: number = undefined;
            var logParam: string = '';

            // 表面の場合
            if (target === 'front') {
                if(personDocInfos.STM3 && personDocInfos.STM3.length < 3 && personDocInfos.CD !== '03' && personDocInfos.CD !== '13') {
                    $scope.side = appConst.CAM_TITLE_SUFF.FRONT_NAME;
                 }else {
                    $scope.side = appConst.CAM_TITLE_SUFF.FIRST_NAME;
                }
                $scope.expansionImg = $scope.idDocFrontimg;
                // 自動マスク画像が表示されている場合
                if ($scope.showAutoFillFrontImage) {
                    $scope.exAutoFillImage = true;
                    $scope.exImageFill = $scope.frontImageFill;
                }
                // アプリケーションログ
                imgHeight = $('#expansion').height();
                imgWidth = $('#expansion').width();
                logParam = imgHeight + '/' + imgWidth;
            // 裏面の場合
            } else if (target === 'back') {
                if (personDocInfos.STM3 && personDocInfos.STM3.length < 3 && personDocInfos.CD !== '03' && personDocInfos.CD !== '13') {
                    $scope.side = appConst.CAM_TITLE_SUFF.BACK_NAME;
                } else {
                    $scope.side = appConst.CAM_TITLE_SUFF.SECOND_NAME;
                }
                $scope.expansionImg = $scope.idDocBackimg;
                // 自動マスク画像が表示されている場合
                if ($scope.showAutoFillBackImage) {
                    $scope.exAutoFillImage = true;
                    $scope.exImageFill = $scope.backImageFill;
                }
                // アプリケーションログ
                imgHeight = $('#expansion').height();
                imgWidth = $('#expansion').width();
                logParam = imgHeight + '/' + imgWidth;
            // 3枚目の場合
            } else if (target === 'third') {
                $scope.side = appConst.CAM_TITLE_SUFF.THIRD_NAME;
                $scope.expansionImg = $scope.idDocThirdimg;
                // アプリケーションログ
                imgHeight = $('#expansion').height();
                imgWidth = $('#expansion').width();
                logParam = imgHeight + '/' + imgWidth;
            }

            // アプリケーションログ
            logicCom.debugLog('元画像の高さ/幅：', logParam);

            // ログ出力
            logicCom.btnTapLog(MAIN_PAGE_ID, EXPANTION_PAGE_ID, '画像拡大');
            // モーダル表示
            $('#expansionModal').modal('show');
            
            // アプリケーションログ
            imgHeight = $('#expansion').height();
            imgWidth = $('#expansion').width();
            logParam = imgHeight + '/' + imgWidth;
            logicCom.debugLog('拡大画像の高さ/幅：', logParam);

            stopBtnEventFLG = false;
        };

        // -----「G1200-01:撮影結果拡大画面」イベント-----

        /**
         * イベント：「閉じる」ボタンタップ時
         */
        $scope.closeBtnClick = (): void => {
            // ログ出力
            logicCom.btnTapLog(EXPANTION_PAGE_ID, MAIN_PAGE_ID, '閉じる');
            $('#expansionModal').modal('hide');
        };

        // -----「G1190-03:撮影結果確認（書類再選択確認）画面」イベント-----
       
        /**
         * イベント：「いいえ」ボタンタップ時
         */
        $scope.backBtnClickNo = (): void => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            }

            // アクションログ出力
            logicCom.btnTapLog(CONFIRM_MODAL_ID, MAIN_PAGE_ID, 'いいえ');
            // モーダル非表示
            $('#' + CONFIRM_MODAL_ID).modal('hide');
            stopBtnEventFLG = false;
        };

        /**
         * イベント：「はい」ボタンタップ時
         */
        $scope.backBtnClickYes = (): void => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            }

            var successCallBack = function () {
                // 申込データ(事務手続き)取得
                var applyInfo: any = AppBizCom.DataHolder.getNotifInfo();
                // 確認書類チェック情報初期化
                applyInfo.KAKNIN_SY_CHK_JOHO = {
                    HONIN_KAKNIN_SY1_YMTR_K: undefined, // 本人確認書類（1種類目）読み取り可能確認区分
                    HONIN_KAKNIN_SY1_UTRK_K: undefined, // 本人確認書類（1種類目）写り込み確認区分
                    HONIN_KAKNIN_SY1_SINKYU_K: undefined, // 本人確認書類（1種類目）新旧情報記載確認区分
                    HONIN_KAKNIN_SY1_NRTB_K: undefined, // 本人確認書類（1種類目）自動塗りつぶし確認区分
                    HONIN_KAKNIN_SY2_YMTR_K: undefined, // 本人確認書類（2種類目）読み取り可能確認区分
                    HONIN_KAKNIN_SY2_UTRK_K: undefined, // 本人確認書類（2種類目）写り込み確認区分
                    HONIN_KAKNIN_SY2_SINKYU_K: undefined, // 本人確認書類（1種類目）新旧情報記載確認区分
                    JIDO_NRTBS_KJY: undefined,          // 自動塗りつぶし解除区分
                    HONIN_KAKNIN_SY1_MYNO_K: undefined, // 本人確認書類（1種類目）個人番号記載確認区分
                    HONIN_KAKNIN_SY2_MYNO_K: undefined  // 本人確認書類（2種類目）個人番号記載確認区分
                }
                // 申込データ(事務手続き)設定
                AppBizCom.DataHolder.setNotifInfo(applyInfo);

                // 「撮影画像データ」初期化
                var imageData: any = AppBizCom.DataHolder.getImageData();
                imageData.HONIN_KAKNIN_SY1_GAZO1 = undefined; // 本人確認書類1種類目画像1
                imageData.HONIN_KAKNIN_SY1_GAZO2 = undefined; // 本人確認書類1種類目画像2
                imageData.HONIN_KAKNIN_SY1_GAZO3 = undefined; // 本人確認書類1種類目画像3
                imageData.HONIN_KAKNIN_SY2_GAZO1 = undefined; // 本人確認書類2種類目画像1
                imageData.HONIN_KAKNIN_SY2_GAZO2 = undefined; // 本人確認書類2種類目画像2
                imageData.HONIN_KAKNIN_SY2_GAZO3 = undefined; // 本人確認書類2種類目画像3
                imageData.AUTO_FILL_GAZO1 = undefined;        // 自動塗りつぶし画像1
                imageData.AUTO_FILL_GAZO2 = undefined;        // 自動塗りつぶし画像2
                AppBizCom.DataHolder.setImageData(imageData);

// 01-2022-06-224 本人確認書類撮影画面のガード対応 開始 20221031
                // 「OCR結果データ」初期化
                var ocrData: any = AppBizCom.DataHolder.getOcrData();
                ocrData = {
                    MODE: undefined,       // 撮影モード
                    CARD_TYPE: undefined   // カードタイプ
                }
                AppBizCom.DataHolder.setOcrData(ocrData);
// 01-2022-06-224 本人確認書類撮影画面のガード対応 終了 20221031

                // 遷移フラグの更新
                var flags: any = AppBizCom.DataHolder.getFlowControlFlg();
                if (!flags.CAMERA_FLG_CONTROL) {
                    flags.CAMERA_FLG_CONTROL = {};
                }
                flags.CAMERA_FLG_CONTROL.SKIP_MASK_FLG = false;
                flags.CAMERA_FLG_CONTROL.SKIP_MASK_FLG2 = false;
                AppBizCom.DataHolder.setFlowControlFlg(flags);
            };

            var path: string = 'selectIdentificationDoc';
            // ログ出力
            logicCom.btnTapLog(CONFIRM_MODAL_ID, 'G1140-01', 'はい');
            $('#' + CONFIRM_MODAL_ID).modal('hide');
            $('body').removeClass('is-modal-open');
            logicCom.locationPath(path, successCallBack, callbackFLG, connectionErrorCallback);
        };

    init();
}]);