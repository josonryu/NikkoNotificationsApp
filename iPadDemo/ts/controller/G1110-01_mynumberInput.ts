// <reference path="../reference.d.ts" />

App.controller('mynumberInputController', ['$scope','$controller','AppBizCom','logicCom', 'AppLgcMultiCheck', 'appConst',
    function ($scope,$controller,AppBizCom,logicCom,AppLgcMultiCheck,appConst) {
        // エラーモーダル用共通コントローラ
        $controller('errorInfoModalCtrl', {$scope: $scope});

        // 画面ID定義
        var MAIN_PAGE_ID: string = 'G1110-01';       // 個人番号入力画面
        var DISPLAY_MODAL_ID: string = 'G1120-01';   // 撮影書面表示（番号確認書類）画面
        var SHOOTING_PAGE_ID: string = 'G1130-01';   // カメラ撮影（番号確認書類）画面
        var PRE_PAGE_ID: string = 'G1100-01';        // 番号確認書類のご説明・ご選択画面画面
        var NEXT_PAGE_ID: string = '';
        var ERR_MODAL_ID: string = 'G1020-02';       // エラーモーダル画面

        // 画面PATH定義
        var NEXT_PAGE_PATH: string = '';

        // ボタン連打防止フラグ
        var stopBtnEventFLG: boolean = false;
        var callbackFLG = function () { };
        // 通信エラー発生する場合、「閉じる」ボタン押下時に、「画面制御 二重制御」フラグを解除する
        var connectionErrorCallback = function () {
            stopBtnEventFLG = false;
        };

        // エラーモーダル用イベント登録
        $('#' + ERR_MODAL_ID).on('show.bs.modal', (): void => {
            $('#' + ERR_MODAL_ID).off('shown.bs.modal');
            if($('body').hasClass('is-modal-open')) {
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

        // カメラプラグイン関係エラーメッセージ（システムエラー）
        var ERR_TITLE: string = AppBizCom.Msg.getMsg('KKAP-CM000-06E', []);
        var ERR_CONTENTS: string = AppBizCom.Msg.getMsg('KKAP-CM000-07E', []);
        var ERR_LOG_MESSAGE_ID: string = 'KKAP-CM000-07E';

         // 番号確認書類マスタデータ取得
        var idTypes: any = AppBizCom.MstData.getCodeMstDataByKbn('NMBR_KAKNN_SHOR');
        var MYNUM_CARD: string = idTypes[0].CD;            // 個人番号カード
        var NOTICE_CARD: string = idTypes[1].CD;           // 通知カード
        var RESIDENCE: string = idTypes[2].CD;             // 住民票の写し
        var RESIDENCE_CERTIFICATE: string = idTypes[3].CD; // 住民票の記載事項証明書

        // 初期化処理
        var init = (): void => {
            // カメラ未初期化時 true
            $scope.noneInitCamFlg = true;

            // カメラ初期化
            AppBizCom.Camera.initCamOcr(
                // 初期化成功時
                function(){
                    // 初期化成功した場合は false
                    $scope.noneInitCamFlg = false;
                },
                // 初期化失敗時
                function(error){
                    // エラーダイアログを表示する
                    $scope.openErrorInfo(ERR_TITLE, ERR_CONTENTS);
                    // アクションログ出力
                    logicCom.errorLog('カメラ初期化エラー', error);
                    // カメラプラグイン終了
                    AppBizCom.Camera.deinitCamOcr(function(){}, function(){});
                }
            );

            // 選択済み番号確認書類情報取得
            var d: any = AppBizCom.DataHolder.getNotifInfo();
            $scope.myNumDocInfos = AppBizCom.MstData.getCodeMstDataByCd('NMBR_KAKNN_SHOR', d.MNSYSEIRY_JOHO.MNSYSEIRY_K);

            // 申込データ(特定個人情報)が存在する場合、個人番号入力項目にデータを出力する。
            var personInfo = AppBizCom.DataHolder.getPersonInfo();
            $scope.MODEL = angular.copy(personInfo) || { MYNO: ''};

            // 遷移元により表示、遷移先変更
            var flags: any = AppBizCom.DataHolder.getFlowControlFlg();
            if (!flags.CAMERA_FLG_CONTROL) {
                flags.CAMERA_FLG_CONTROL = {};
            }
            $scope.editMode = flags.CAMERA_FLG_CONTROL.MOD_FLG;

            // パンくずの表示パターン
            $scope.pankuzuPatten = $scope.editMode ? '4' : '2';

            // 画面項目の表示/非表示
            $scope.showHeadsUp = false;
            $scope.showOcrResult = false;

            // メッセージ内容初期化
            $scope.msgHeadsUp = '';

            // 画面入力項目データをスコープへ設定
            $scope.input = angular.copy(inputData);
        }

        // 個人番号のOCR撮影処理
        var shootingMynumOCR = (): void =>{
            
            // 「G140-01:カメラ撮影（番号確認書類）画面」タイトル設定
            if ($scope.myNumDocInfos.CD === MYNUM_CARD) {
                // 個人番号カード（裏面）
                $scope.cameraTitle = $scope.myNumDocInfos.MSY + " " + appConst.CAM_TITLE_SUFF.BACK_NAME;
            } else {
                // 通知カード（表面）
                $scope.cameraTitle = $scope.myNumDocInfos.MSY + " " + appConst.CAM_TITLE_SUFF.FRONT_NAME;
            }

            // ログ出力
            logicCom.btnTapLog(DISPLAY_MODAL_ID, SHOOTING_PAGE_ID, '読取開始');

            // カメラプレビュー画面表示
            logicCom.change2CameraPreview(MAIN_PAGE_ID, DISPLAY_MODAL_ID, SHOOTING_PAGE_ID);

            AppBizCom.Camera.startCamOcr(
                // 撮影成功時
                camInfo => {
                    // ログ出力
                    logicCom.callbackLog(SHOOTING_PAGE_ID, MAIN_PAGE_ID, 'カメラ撮影成功');

                    var targetType: number = 0;
                    // 選択済み番号確認書類より撮影対象を指定
                    if ($scope.myNumDocInfos.CD === MYNUM_CARD) {
                        // 個人番号カード（裏面）
                        targetType = appConst.CARD_TYPE.MY_NUMBER_BACK;
                    } else if ($scope.myNumDocInfos.CD === NOTICE_CARD){
                        // 通知カード
                        targetType = appConst.CARD_TYPE.NOTIFICATION;
                    }

                    // 選択書面と撮影書面の整合性確認
                    if (camInfo.cardType !== targetType) {
                        camInfo.number = camInfo.number || {};
                        camInfo.number.text = '';
                    }

                    // OCR結果取得
                    $scope.mynumberOcr = camInfo.number.text;

                    // OCR結果表示処理
                    var headsUpID: string = '';

                    if (AppBizCom.InputCheck.isEmpty(camInfo.number.text)) {
                        // 注意喚起メッセージ
                        headsUpID = 'KKAP-SF008-03I';
                        // OCR結果非表示
                        $scope.showOcrResult = false;
                    } else {
                        // 注意喚起メッセージ
                        headsUpID = 'KKAP-SF008-02I';
                        // OCR結果表示
                        $scope.showOcrResult = true;
                    }

                    // 注意喚起メッセージ取得
                    $scope.msgHeadsUp = AppBizCom.Msg.getMsg(headsUpID, []);
                    // 注意喚起メッセージ表示
                    $scope.showHeadsUp = true;

                    // 遷移元画面表示
                    logicCom.change2DefaultView(MAIN_PAGE_ID, undefined, SHOOTING_PAGE_ID);
                    $('#' + DISPLAY_MODAL_ID).modal('hide');
                    $('#' + DISPLAY_MODAL_ID).css('display', 'inherit');

                    $scope.$apply();
                },
                // エラー発生時
                error => {
                    // エラーダイアログを表示する
                    $scope.openErrorInfo(ERR_TITLE, ERR_CONTENTS);
                    // ログ出力
                    logicCom.callbackErrLog(SHOOTING_PAGE_ID, ERR_MODAL_ID, 'カメラ撮影エラー');
                    logicCom.change2DefaultView(MAIN_PAGE_ID, DISPLAY_MODAL_ID, SHOOTING_PAGE_ID);
                    // カメラプラグイン終了
                    AppBizCom.Camera.deinitCamOcr(function(){}, function(){});
                },
                // キャンセル時
                (): void => {
                    // ログ出力
                    logicCom.callbackLog(SHOOTING_PAGE_ID, MAIN_PAGE_ID, 'cancelCallBack', 'カメラ撮影キャンセル');
                    logicCom.change2DefaultView(MAIN_PAGE_ID, undefined, SHOOTING_PAGE_ID);
                    $('#' + DISPLAY_MODAL_ID).modal('hide');
                    $('#' + DISPLAY_MODAL_ID).css('display', 'inherit');
                }
            );
        }

        $scope.doAnyTimeCheck = result => {
            var chkObj = inputData['MYNO'];
            var type = 'onBlurChk';
            chkObj.val = $scope.MODEL.MYNO;
            AppBizCom.Msg.clearError(inputData.MYNO.id);
            return AppLgcMultiCheck.inputCheck(chkObj, type);
        }

        var showError = (inputData, msgText): void => {
            AppBizCom.Msg.showErrorMsgText(inputData.MYNO.id, msgText);
            if ($('#' + inputData.MYNO.id).length != 0 && $('#' + inputData.MYNO.id).hasClass('err') === false){
                AppBizCom.Msg.showErrorItem(inputData.MYNO.id);
            }
        }
        
        // -----「G1110-01:個人番号入力画面」イベント-----

        // イベント：初期処理
        $scope.init = (): void => {
        };

        // イベント：「書類読取」ボタンタップ時
        $scope.btnOcrClick = (): void => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            }

            // ログ出力
            logicCom.btnTapLog(MAIN_PAGE_ID, DISPLAY_MODAL_ID, '書類読取');
            // モーダル表示
            $('#' + DISPLAY_MODAL_ID).modal('show');

            stopBtnEventFLG = false;
        }

        // イベント：OCR結果反映ボタンタップ時
        $scope.btnInputOcrClick = index => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            }

            // 入力チェックエラークリア
            AppBizCom.Msg.clearAllErrors();

            switch (index) {
                case 'mynumber':
                    // OCR結果を反映
                    $scope.MODEL.MYNO = $scope.mynumberOcr;
                    $scope.doAnyTimeCheck();
                    break;
                default:
                    break;
            }

            stopBtnEventFLG = false;
        };

        // イベント：「戻る」ボタンタップ時
        $scope.btnBackClick = (): void => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            }

             // 1) 前画面へ遷移する。遷移先は共通処理「APPBIZ-00010：業務共通領域」により取得する。
             var path:string = AppBizCom.DataHolder.getPrevRoutePath();
             logicCom.locationPath(path, callbackFLG, callbackFLG, connectionErrorCallback);

             // アクションログ出力
            logicCom.btnTapLog(MAIN_PAGE_ID, PRE_PAGE_ID, '戻る');
        };

        // イベント：「次へ」ボタンタップ時
        $scope.btnNextClick = (): void => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            }

            // 入力チェックエラークリア
            AppBizCom.Msg.clearAllErrors();

            var checkResult: any = {
                'MYNO' : {
                    'chkErr': false,
                    'chkResult': {
                        'value': '************'
                    }
                }
            };
            // 必須チェック
            if(AppBizCom.InputCheck.isEmpty($scope.MODEL.MYNO)) {
                checkResult.MYNO.chkErr = true;
                checkResult.MYNO.chkResult.msgId = ['KKAP-CM000-01E'];
                // エラー項目表示
                var msgText = AppBizCom.Msg.getMsg('KKAP-CM000-01E', [inputData.MYNO.name]);
                showError(inputData, msgText);
            } else {
                // 属性チェック
                if(!AppBizCom.InputCheck.isNum($scope.MODEL.MYNO)) {
                    checkResult.MYNO.chkErr = true;
                    checkResult.MYNO.chkResult.msgId = ['KKAP-CM000-03E'];
                    // エラー項目表示
                    var msgText = AppBizCom.Msg.getMsg('KKAP-CM000-03E', [inputData.MYNO.name, inputData.MYNO.attribute]);
                    showError(inputData, msgText);
                }

                // 桁数チェック
                if(AppBizCom.InputCheck.chkMaxLength($scope.MODEL.MYNO, inputData.MYNO.length) !== 0) {
                    checkResult.MYNO.chkErr = true;
                    if (checkResult.MYNO.chkResult.msgId) {
                        checkResult.MYNO.chkResult.msgId.push('KKAP-CM000-04E');
                    } else {
                        checkResult.MYNO.chkResult.msgId = ['KKAP-CM000-04E'];
                    }
                    // エラー項目表示
                    var msgText = AppBizCom.Msg.getMsg('KKAP-CM000-04E', [inputData.MYNO.name, inputData.MYNO.length]);
                    showError(inputData, msgText);
                // チェックディジット
                } else if(!AppBizCom.InputCheck.isMyNumber($scope.MODEL.MYNO)) {
                    checkResult.MYNO.chkErr = true;
                    if (checkResult.MYNO.chkResult.msgId) {
                        checkResult.MYNO.chkResult.msgId.push('KKAP-SF008-01E');
                    } else {
                        checkResult.MYNO.chkResult.msgId = ['KKAP-SF008-01E'];
                    }
                    // エラー項目表示
                    var msgText = AppBizCom.Msg.getMsg('KKAP-SF008-01E');
                    showError(inputData, msgText);
                }
            }

            // ログ出力用「次へ」ボタン表示名
            var btnName: string = $scope.editMode ? '確認画面へ' : '次へ' ;

            if (!checkResult.MYNO.chkErr) {
                // 修正時の場合
                if($scope.editMode){
                    // ログ出力用遷移先画面ID
                    NEXT_PAGE_ID = 'G1240-01';
                    // 「G1240-01:お客様確認画面」へ遷移
                    NEXT_PAGE_PATH = 'applicationConfirm';
                    
                // 個人番号カード選択時
                }else if($scope.myNumDocInfos.CD == MYNUM_CARD){
                    // 申込データ(事務手続き)取得
                    var applyInfo = AppBizCom.DataHolder.getNotifInfo();

                    // 本人確認書類選択（個人番号カード）
                    applyInfo.HONIN_KAKNIN_SY_JOHO = {
                        HONIN_KAKNIN_SY_K_1: '01', // 個人番号カード
                        HONIN_KAKNIN_SY_YUSO_K_1: '1',
                        HONIN_KAKNIN_SY_K_2: undefined,
                        HONIN_KAKNIN_SY_YUSO_K_2: undefined
                    }

                    // 申込データ(事務手続き)設定
                    AppBizCom.DataHolder.setNotifInfo(applyInfo);

                    // ログ出力用遷移先画面ID
                    NEXT_PAGE_ID = 'G1150-01';
                    // 「G1150-01:撮影開始説明画面」へ遷移
                    NEXT_PAGE_PATH = 'cameraDescription';
                }else{
                    // ログ出力用遷移先画面ID
                    NEXT_PAGE_ID = 'G1140-01';
                    // 「G1140-01:本人確認書類のご説明・ご選択画面」へ遷移
                    NEXT_PAGE_PATH = 'selectIdentificationDoc';
                }

                // 申込データ(特定個人情報)設定
                AppBizCom.DataHolder.setPersonInfo($scope.MODEL);

                // ログ出力
                logicCom.btnTapLog(MAIN_PAGE_ID, NEXT_PAGE_ID, btnName, checkResult);
                // 画面遷移
                logicCom.locationPath(NEXT_PAGE_PATH, callbackFLG, callbackFLG, connectionErrorCallback);
            } else {
                var maskChar: string = '*';
                checkResult.MYNO.chkResult.value = maskChar.repeat($scope.MODEL.MYNO.length);
                // ログ出力
                logicCom.btnTapErrLog(MAIN_PAGE_ID, MAIN_PAGE_ID, btnName, checkResult);

                stopBtnEventFLG = false;
            }
        };

        // -----「G1120-01:撮影書面表示（番号確認書類）画面」イベント-----

        // イベント：初期処理
        $scope.initModal = (): void =>{
            
            // 「G1120-01:撮影書面表示（番号確認書類）画面」の初期表示設定
            var surface: string = '';

            // 個人番号カードの場合
            if ($scope.myNumDocInfos.CD === MYNUM_CARD) {
                // 裏面
                surface = appConst.CAM_DISPLAY_MODAL.BACK_NAME;
                $scope.popupMode = 'BACK';
                $scope.imgClass = 'mynumber';
            // 通知カードの場合
            } else if ($scope.myNumDocInfos.CD === NOTICE_CARD) {
                // 表面
                surface = appConst.CAM_DISPLAY_MODAL.FRONT_NAME;
                $scope.popupMode = 'FRONT';
                $scope.imgClass = 'notice';
            }

            if (surface !== '') {
                // メッセージ取得
                var msgParam: [string] = [$scope.myNumDocInfos.MSY + 'の<span class="strong">' + surface + '</span>'];
                var msgText: string = AppBizCom.Msg.getMsg('KKAP-SF009-02I', msgParam);
                // メッセージ表示
                $('#G1120Title').html(msgText);
            }

            // イベント登録
            $('#' + DISPLAY_MODAL_ID).on('show.bs.modal', (): void => {
                $('body').addClass('is-modal-open');
            });
            $('#' + DISPLAY_MODAL_ID).on('hidden.bs.modal', (): void => {
                $('body').removeClass('is-modal-open');
                stopBtnEventFLG = false;
            });

            // イベント廃棄
            $scope.$on('$destroy', (): void => {
                $('#' + DISPLAY_MODAL_ID).off('show.bs.modal');
                $('#' + DISPLAY_MODAL_ID).off('hidden.bs.modal');
            });
        }
        

        // イベント：「戻る」ボタンタップ時
        $scope.G1120BtnBackClick = (): void => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            }

            // ログ出力
            logicCom.btnTapLog(DISPLAY_MODAL_ID, MAIN_PAGE_ID, '戻る');
            // モーダル非表示
            $('#' + DISPLAY_MODAL_ID).modal('hide');

            stopBtnEventFLG = false;
        }

        // イベント：「読取開始」ボタンタップ時
        $scope.btnTakePictStartClick = (): void => {
            // ダブルタップ対応
            if (stopBtnEventFLG) {
                return;
            } else {
                stopBtnEventFLG = true;
            }
            
            shootingMynumOCR();
        }

        // 画面入力項目定義
        var inputData: any = {
            MYNO: {
                applyName: 'MYNO', // 共通領域項目名
                id: 'txtMynumber', // 画面項目id
                name: '個人番号', // 画面項目名
                typeSelect: false, // 入力項目タイプ
                attribute: '半角数字',
                numPad: 'numkeyboard-right', // 数字キーボード
                length: 12, // 桁数
                onBlurChk: [['isNum', 'chkSameLength']],
                allChk: [['isEmpty'], ['isNum', 'chkSameLength'], ['isMyNumber']]
            }
        };

        // 初期化
        init();
    }]);