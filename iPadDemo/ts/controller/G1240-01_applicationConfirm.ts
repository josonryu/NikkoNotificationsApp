/// <reference path="../reference.d.ts" />
/*
    修正履歴
    2021/02/09 インシデント対応 ITI本夛 戻るボタンで画面を戻って遷移した際に、一部共通領域の項目が初期化されていなかったため、条件式を修正
 */

declare let InkTool: any;
App.controller('applicationConfirmController', ['$scope', '$controller', '$anchorScroll', '$timeout', 'AppBizDataHolder', 'AppBizMsg', 'logicCom', 'AppComDevice', 'AppBizCodeMstData',
    function ($scope, $controller, $anchorScroll, $timeout, AppBizDataHolder, AppBizMsg, logicCom, AppComDevice, AppBizCodeMstData) {

        $controller('confirmCommon', { $scope: $scope });

        var strConst = {
            // 空文字
            EMPTY_CHAR: '',
            // 暗証番号確認ボタンラベル
            PIN_BUTTON_LABEL_DISP: '暗証番号を表示',
            PIN_BUTTON_LABEL_HIDDEN: '暗証番号を隠す',
            // BASE64画像データのヘッダー
            BASE64_HEAD: 'data:image/jpeg;base64,'
        }

        var pathConst = {
            // 該当画面
            BASE_PATH: 'applicationConfirm',
            // 事務手続き画面
            INPUT_PATH: 'inputNotifications',
            // 暗証番号入力画面
            PIN_PATH: 'customerFinalInput',
            // 番号確認書類のご説明・ご選択画面
            SELN_PATH: 'selectNecessaryDoc',
            // 本人確認書類の開始画面
            SELI_PATH: 'selectIdentificationDescription',
        }

        var pageId = {
            // 事務手続き画面
            inputNotifications: 'G1080-01',
            // 確認書類撮影開始画面
            selectIdentificationDescription: 'G1090-01',
            // 暗証番号確認画面
            customerFinalInput: 'G1230-01',

            PAGE_ID: 'G1240-01',
            PAGE_ID_EDIT: 'G1240-03',
            PAGE_ID_SIGN: 'G1240-02',
            PAGE_ID_NEXT: 'G1250-01',
            PAGE_ID_ERR: 'G1240-04'
        }

        // CD-001:申込データ（事務手続き）
        var notifInfo: any = {};
        // CD-001:申込データ（事務手続き）-> 事務手続き情報
        var jimuJoho: any = {};
        // CD-001:申込データ（事務手続き）-> 暗証番号情報
        var pinJoho: any = {};
        // CD-001:申込データ（事務手続き）-> 番号確認書類情報
        var mnsyseiryJoho: any = {};
        // CD-001:申込データ（事務手続き）-> 本人確認書類情報
        var honinKakninSyJoho: any = {};
        // CD-001:申込データ（事務手続き）-> 確認書類チェック情報
        var kakninSyChkJoho: any = {};
        // CD-003:画像データ
        var imageData: any = {};
        // CD-004:顧客契約情報
        var customer: any = {};
        // CD-007:位置情報
        var position: any = {};
        // CD-008:画面遷移制御用フラグ
        var flowControlFlg: any = {};
        // CD-008:画面遷移制御用フラグ -> 入力画面遷移制御
        var inputFlgControl: any = {};
        // CD-010:申込データ（特定個人情報）
        var personInfo: any = {};

        var getString = function (target) {
            return (target || target === +target) ? target + strConst.EMPTY_CHAR : strConst.EMPTY_CHAR;
        }

        var getObject = function (obj) {
            return angular.isObject(obj) ? angular.copy(obj) : {};
        }

        // 保存済み共通領域から画面への読み込み処理
        var loadApplyInfo = function () {
            // CD-001:申込データ（事務手続き）
            notifInfo = getObject(AppBizDataHolder.getNotifInfo());
            // CD-001:申込データ（事務手続き）-> 事務手続き情報
            jimuJoho = getObject(notifInfo.JIMU_JOHO);
            // CD-001:申込データ（事務手続き）-> 暗証番号情報
            pinJoho = getObject(notifInfo.PIN_JOHO);
            // CD-001:申込データ（事務手続き）-> 番号確認書類情報
            mnsyseiryJoho = getObject(notifInfo.MNSYSEIRY_JOHO);
            // CD-001:申込データ（事務手続き）-> 本人確認書類情報
            honinKakninSyJoho = getObject(notifInfo.HONIN_KAKNIN_SY_JOHO);
            // CD-001:申込データ（事務手続き）-> 確認書類チェック情報
            kakninSyChkJoho = getObject(notifInfo.KAKNIN_SY_CHK_JOHO);
            // CD-003:画像データ
            imageData = getObject(AppBizDataHolder.getImageData());
            // CD-004:顧客契約情報
            customer = getObject(AppBizDataHolder.getCustomer());
            // CD-007:位置情報
            position = getObject(AppBizDataHolder.getLocation());
            // CD-008:画面遷移制御用フラグ
            flowControlFlg = getObject(AppBizDataHolder.getFlowControlFlg());
            // CD-008:画面遷移制御用フラグ -> 入力画面遷移制御
            inputFlgControl = getObject(flowControlFlg.INPUT_FLG_CONTROL);
            // CD-010:申込データ（特定個人情報）
            personInfo = getObject(AppBizDataHolder.getPersonInfo());

            var flowCtlFlg = getObject(AppBizDataHolder.getFlowControlFlg());
            var camerafFlgCtl = getObject(flowCtlFlg.CAMERA_FLG_CONTROL);
            // 撮影画面遷移制御.確認書類修正フラグ
            camerafFlgCtl.MOD_FLG = false;
            // 撮影画面遷移制御.本人確認書類修正フラグ
            camerafFlgCtl.MOD_ID_FLG = false;
            flowCtlFlg.CAMERA_FLG_CONTROL = camerafFlgCtl;
            AppBizDataHolder.setFlowControlFlg(flowCtlFlg);
        }

        // エラーチェック
        var errorCheck = function () {
            // 全体エラー有無
            var wholeHasError = false;
            // 全体エラーメッセージ
            var wholeErrMsg = [];
            // 全体エラーメッセージID
            var wholeErrMsgId = [];

            // 日興カード暗証番号（変更後）
            //「申込データ(事務手続き).事務手続き情報.日興カード申込区分」が「1：新規」または「3：再発行」、かつ「申込データ(事務手続き).暗証番号情報.日興カード暗証番号」が設定されていない場合エラー。
            var errNikoCardPin = ('1' === getString(jimuJoho.NIKKO_CARD) || '3' === getString(jimuJoho.NIKKO_CARD)) && '' === getString(pinJoho.NIKKO_CARD_PIN);

            // ②-1 個人番号
            //「申込データ(事務手続き).事務手続き情報.個人番号告知」が「1：告知する」または「申込データ(事務手続き).事務手続き情報.番号確認書類持参フラグ」が「1:持参あり」、かつ「申込データ（特定個人情報）.個人番号」が設定されていない場合エラー。
            var errMynumber = ('1' === getString(jimuJoho.MYNO_KOKUCHI) || '1' === getString(jimuJoho.MNSYSEIRY_JISN_FLAG)) && '' === getString(personInfo.MYNO);

            // ②-2 本人確認書類１種類目タイトル 本人確認書類２種類目タイトル
            // 変更項目に氏名、住所、特定口座（開設）、NISA口座開設、個人番号告知が含まれる、かつ本人確認書類（1種類目）が設定されていない場合エラー。
            var errSyuruiTitle =
                ('1' === getString(inputFlgControl.KYAKNM_F)
                || '1' === getString(inputFlgControl.KYAK_ADDR_F)
                || ('1' === getString(inputFlgControl.TKTEI_KOZA_F) && '1' === getString(jimuJoho.TKTEI_KOZA_MSKM))
                || '1' === getString(inputFlgControl.NISA_KOZA_F)
                || '1' === getString(inputFlgControl.MYNO_KOKUCHI_F))
                    && ('' === getString(honinKakninSyJoho.HONIN_KAKNIN_SY_K_1)
                    && '' === getString(honinKakninSyJoho.HONIN_KAKNIN_SY_YUSO_K_1));

            // 番号確認書類 本人確認書類１種類目タイトル 本人確認書類２種類目タイトル
            // ②-3 「申込データ(事務手続き).番号確認書類情報.個人番号確認書類区分」が「1：個人番号カード」の場合、
            // かつ「申込データ(事務手続き).本人確認書類情報.本人確認書類区分（1種類目）」が未設定ではなく、
            // 「1：個人番号カード」以外が設定されている場合エラー。
            var errMynumberCard = '1' === mnsyseiryJoho.MNSYSEIRY_K && '' !== getString(honinKakninSyJoho.HONIN_KAKNIN_SY_K_1) && '01' !== getString(honinKakninSyJoho.HONIN_KAKNIN_SY_K_1);

            var msgId = strConst.EMPTY_CHAR;

            var errNikoCardPinMsg = strConst.EMPTY_CHAR;
            if (errNikoCardPin) {
                msgId = 'KKAP-CM000-01E';
                var errMsg = getString(AppBizMsg.getMsg(msgId, ['暗証番号']));
                errNikoCardPinMsg = errMsg;
                wholeErrMsg.push(errMsg);
                wholeErrMsgId.push(msgId);
            }

            var errMynumberMsg = strConst.EMPTY_CHAR;
            if (errMynumber) {
                msgId = 'KKAP-SFJ14-01E';
                var errMsg = getString(AppBizMsg.getMsg(msgId, undefined));
                errMynumberMsg = errMsg;
                wholeErrMsg.push(errMsg);
                wholeErrMsgId.push(msgId);
            }

            var errSyuruiTitleMsg = strConst.EMPTY_CHAR;
            if (errSyuruiTitle) {
                msgId = 'KKAP-SFJ14-02E';
                var errMsg = getString(AppBizMsg.getMsg(msgId, undefined));
                errSyuruiTitleMsg = errMsg;
                wholeErrMsg.push(errMsg);
                wholeErrMsgId.push(msgId);
            }

            var errMynumberCardMsg = strConst.EMPTY_CHAR;
            if (errMynumberCard) {
                msgId = 'KKAP-SF019-03E';
                var errMsg = getString(AppBizMsg.getMsg(msgId, undefined));
                errMynumberCardMsg = errMsg;
                wholeErrMsg.push(errMsg);
                wholeErrMsgId.push(msgId);
            }

            if (wholeErrMsg.length > 0) {
                wholeHasError = true;
            }

            // 画面エラー制御
            $scope.pageErrCtl = {
                wholeHasError: wholeHasError, // 画面にエラーがある
                errNikoCardPin: errNikoCardPin, // 日興カード暗証番号（変更後）
                errMynumber: errMynumber, // 個人番号
                errSyuruiTitle: errSyuruiTitle, // 本人確認書類１種類目タイトル 本人確認書類２種類目タイトル
                errMynumberCard: errMynumberCard, // 番号確認書類 本人確認書類１種類目タイトル 本人確認書類２種類目タイトル
            }

            //　画面エラーメッセージ
            $scope.pageErrMsg = {
                wholeErrMsg: wholeErrMsg, // 全体エラーメッセージ
                wholeErrMsgId: wholeErrMsgId, // 全体エラーメッセージID
                errNikoCardPinMsg: errNikoCardPinMsg, // 日興カード暗証番号（変更後）
                errMynumberMsg: errMynumberMsg, // 個人番号
                errSyuruiTitleMsg: errSyuruiTitleMsg, // 本人確認書類１種類目タイトル 本人確認書類２種類目タイトル
                errMynumberCardMsg: errMynumberCardMsg, // 番号確認書類 本人確認書類１種類目タイトル 本人確認書類２種類目タイトル
            }

        }

        // 画面初期化
        var pageInit = function () {

            // 暗証番号を表示／暗証番号を隠す
            $scope.pwdShowBtnLab = strConst.PIN_BUTTON_LABEL_DISP;
            // 署名画像
            $scope.symGazou = strConst.EMPTY_CHAR;

            // 申込情報の補正処理を実施
            // 日興カードが変更対象外また申込区分を「解除」へ変更、かつ日興カードの暗証番号が設定された場合
            $scope.clearPinJoho = (('0' === getString(inputFlgControl.NIKKO_CARD_F) || '2' === getString(jimuJoho.NIKKO_CARD)) && '' !== getString(pinJoho.NIKKO_CARD_PIN));
            if ($scope.clearPinJoho) {
                pinJoho.NIKKO_CARD_PIN = undefined; // 日興カード暗証番号
                pinJoho.NIKKO_CARD_MSKM_K = undefined; // 日興カード申し込み確認区分
                notifInfo.PIN_JOHO = pinJoho;
                AppBizDataHolder.setNotifInfo(notifInfo);
            }

            // ①-1 変更項目に氏名、住所、特定口座（開設）、NISA口座開設、個人番号告知が含まれない、かつ本人確認書類が設定された場合
            var clearCheck1 = 
                !('1' === getString(inputFlgControl.KYAKNM_F)
                || '1' === getString(inputFlgControl.KYAK_ADDR_F)
                || ('1' === getString(inputFlgControl.TKTEI_KOZA_F) && '1' === getString(jimuJoho.TKTEI_KOZA_MSKM))
                || '1' === getString(inputFlgControl.NISA_KOZA_F)
                || '1' === getString(inputFlgControl.MYNO_KOKUCHI_F))
                    && ('' !== getString(honinKakninSyJoho.HONIN_KAKNIN_SY_K_1)
                    || '' !== getString(honinKakninSyJoho.HONIN_KAKNIN_SY_YUSO_K_1));

            // ①-2「申込データ(事務手続き).事務手続き情報.個人番号告知」が「1：告知する」または
            // 「申込データ(事務手続き).事務手続き情報.番号確認書類持参フラグ」が「1:持参あり」、
            // かつ本人確認書類1点目が「顔写真なし」で本人確認書類2点目が設定されていない場合
            var idType1 = AppBizCodeMstData.getCodeMstDataByCd('HONIN_KAKNIN_SY', getString(honinKakninSyJoho.HONIN_KAKNIN_SY_K_1));
            var clearCheck2 = 
                ('1' === getString(jimuJoho.MYNO_KOKUCHI)
                || '1' === getString(jimuJoho.MNSYSEIRY_JISN_FLAG))
                    && (idType1 && ('0' === idType1.STM2))
                        && ('' === getString(honinKakninSyJoho.HONIN_KAKNIN_SY_K_2)
                        && '' === getString(honinKakninSyJoho.HONIN_KAKNIN_SY_YUSO_K_2));

            // 上記①-1、①-2のいずれかが満たす場合
            // ・本人確認書類情報.本人確認書類区分（1種類目）、本人確認書類郵送区分（1種類目）をクリア
            // ・本人確認書類情報.本人確認書類区分（2種類目）、本人確認書類郵送区分（2種類目）をクリア
            // ・確認書類チェック情報（全項目）
            // ・本人確認書類1種類目画像1～3をクリア
            // ・本人確認書類2種類目画像1～3をクリア
            $scope.clearSyuruiJoho = clearCheck1 || clearCheck2;
            if ($scope.clearSyuruiJoho) {
                honinKakninSyJoho.HONIN_KAKNIN_SY_K_1 = undefined;         // 本人確認書類情報.本人確認書類区分（1種類目）
                honinKakninSyJoho.HONIN_KAKNIN_SY_YUSO_K_1 = undefined;    // 本人確認書類情報.本人確認書類郵送区分（1種類目）
                honinKakninSyJoho.HONIN_KAKNIN_SY_K_2 = undefined;         // 本人確認書類情報.本人確認書類区分（2種類目）
                honinKakninSyJoho.HONIN_KAKNIN_SY_YUSO_K_2 = undefined;    // 本人確認書類情報.本人確認書類郵送区分（2種類目）
                notifInfo.HONIN_KAKNIN_SY_JOHO = honinKakninSyJoho;

                kakninSyChkJoho.HONIN_KAKNIN_SY1_YMTR_K = undefined;       // 本人確認書類（1種類目）読み取り可能確認区分
                kakninSyChkJoho.HONIN_KAKNIN_SY1_UTRK_K = undefined;       // 本人確認書類（1種類目）写り込み確認区分
                kakninSyChkJoho.HONIN_KAKNIN_SY1_SINKYU_K = undefined;     // 本人確認書類（1種類目）新旧情報記載確認区分
                kakninSyChkJoho.HONIN_KAKNIN_SY1_NRTB_K = undefined;       // 本人確認書類（1種類目）自動塗りつぶし確認区分
                kakninSyChkJoho.HONIN_KAKNIN_SY2_YMTR_K = undefined;       // 本人確認書類（2種類目）読み取り可能確認区分
                kakninSyChkJoho.HONIN_KAKNIN_SY2_UTRK_K = undefined;       // 本人確認書類（2種類目）写り込み確認区分
                kakninSyChkJoho.HONIN_KAKNIN_SY2_SINKYU_K = undefined;     // 本人確認書類（2種類目）新旧情報記載確認区分
                kakninSyChkJoho.JIDO_NRTBS_KJY = undefined;                // 自動塗りつぶし解除区分
                kakninSyChkJoho.HONIN_KAKNIN_SY1_MYNO_K = undefined;       // 本人確認書類（1種類目）個人番号記載確認区分
                kakninSyChkJoho.HONIN_KAKNIN_SY2_MYNO_K = undefined;       // 本人確認書類（2種類目）個人番号記載確認区分
                notifInfo.KAKNIN_SY_CHK_JOHO = kakninSyChkJoho;

                AppBizDataHolder.setNotifInfo(notifInfo);

                imageData.HONIN_KAKNIN_SY1_GAZO1 = undefined; // 本人確認書類1種類目画像1
                imageData.HONIN_KAKNIN_SY1_GAZO2 = undefined; // 本人確認書類1種類目画像2
                imageData.HONIN_KAKNIN_SY1_GAZO3 = undefined; // 本人確認書類1種類目画像3
                imageData.HONIN_KAKNIN_SY2_GAZO1 = undefined; // 本人確認書類2種類目画像1
                imageData.HONIN_KAKNIN_SY2_GAZO2 = undefined; // 本人確認書類2種類目画像2
                imageData.HONIN_KAKNIN_SY2_GAZO3 = undefined; // 本人確認書類2種類目画像3
                AppBizDataHolder.setImageData(imageData);
            }

            // ①-3「変更項目に個人番号告知が含まれず（個人番号告知済み）、かつ氏名、住所、特定口座（開設）、NISA口座開設が含まれ、
            // かつ番号確認書類持参フラグが”1:持参あり”以外の場合
            $scope.clearSyurui2Joho = 
                ('1' === getString(customer.MYNO_KKC))
                    && ('1' === getString(inputFlgControl.KYAKNM_F)
                    || '1' === getString(inputFlgControl.KYAK_ADDR_F)
                    || ('1' === getString(inputFlgControl.TKTEI_KOZA_F) && '1' === getString(jimuJoho.TKTEI_KOZA_MSKM))
                    || '1' === getString(inputFlgControl.NISA_KOZA_F))
                        && ('1' !== getString(jimuJoho.MNSYSEIRY_JISN_FLAG));

            // 上記①-3の場合
            // ・本人確認書類情報.本人確認書類区分（2種類目）、本人確認書類郵送区分（2種類目）をクリア
            // ・確認書類チェック情報（2種類目の項目のみ）
            // ・本人確認書類2種類目画像1～3をクリア
            if ($scope.clearSyurui2Joho) {
                honinKakninSyJoho.HONIN_KAKNIN_SY_K_2 = undefined;         // 本人確認書類情報.本人確認書類区分（2種類目）
                honinKakninSyJoho.HONIN_KAKNIN_SY_YUSO_K_2 = undefined;    // 本人確認書類情報.本人確認書類郵送区分（2種類目）
                notifInfo.HONIN_KAKNIN_SY_JOHO = honinKakninSyJoho;

                kakninSyChkJoho.HONIN_KAKNIN_SY2_YMTR_K = undefined;       // 本人確認書類（2種類目）読み取り可能確認区分
                kakninSyChkJoho.HONIN_KAKNIN_SY2_UTRK_K = undefined;       // 本人確認書類（2種類目）写り込み確認区分
                kakninSyChkJoho.HONIN_KAKNIN_SY2_SINKYU_K = undefined;     // 本人確認書類（2種類目）新旧情報記載確認区分
                kakninSyChkJoho.HONIN_KAKNIN_SY2_MYNO_K = undefined;     // 本人確認書類（2種類目）個人番号記載確認区分
                notifInfo.KAKNIN_SY_CHK_JOHO = kakninSyChkJoho;

                AppBizDataHolder.setNotifInfo(notifInfo);

                imageData.HONIN_KAKNIN_SY2_GAZO1 = undefined; // 本人確認書類2種類目画像1
                imageData.HONIN_KAKNIN_SY2_GAZO2 = undefined; // 本人確認書類2種類目画像2
                imageData.HONIN_KAKNIN_SY2_GAZO3 = undefined; // 本人確認書類2種類目画像3
                AppBizDataHolder.setImageData(imageData);
            }
            
            // ①-4 画面遷移制御用フラグ「個人番号告知フラグ」が ”0:修正なし”（個人番号未申告の場合）　もしくは 
            // 申込データ（事務手続き）「番号確認書類持参フラグ」が ”1:持参あり”以外（個人番号告知済みの場合）、
            // かつ個人番号が設定された場合
            // 2021/02/09 インシデント対応 ITI本夛 修正開始(マイナンバー申請書類区分のみ設定されている場合の条件式追加)
            /*
            $scope.clearMynumberJoho = 
                ((('0' === getString(customer.MYNO_KKC)) && ('0' === getString(inputFlgControl.MYNO_KOKUCHI_F)))
                || (('1' === getString(customer.MYNO_KKC)) && (('1' !== getString(jimuJoho.MNSYSEIRY_JISN_FLAG)))))
                    && ('' !== getString(personInfo.MYNO));
            */
            $scope.clearMynumberJoho = 
                (
                    ((('0' === getString(customer.MYNO_KKC)) && ('0' === getString(inputFlgControl.MYNO_KOKUCHI_F)))
                    || (('1' === getString(customer.MYNO_KKC)) && (('1' !== getString(jimuJoho.MNSYSEIRY_JISN_FLAG)))))
                        && ('' !== getString(personInfo.MYNO))
                ) || (
                    ('0' === getString(inputFlgControl.MYNO_KOKUCHI_F))
                    && ('1' !== (getString(jimuJoho.MNSYSEIRY_JISN_FLAG)))
                    && ('' === getString(personInfo.MYNO))
                    && ('' !== getString(mnsyseiryJoho.MNSYSEIRY_K))
                );
            // 2021/02/09 インシデント対応 ITI本夛 修正完了

            // 上記①-4の場合
            // ・番号確認書類情報.個人番号確認書類区分をクリア
            // ・個人番号をクリア
            if ($scope.clearMynumberJoho) {
                mnsyseiryJoho.MNSYSEIRY_K = undefined; // 番号確認書類情報.個人番号確認書類区分
                notifInfo.MNSYSEIRY_JOHO = mnsyseiryJoho;
                AppBizDataHolder.setNotifInfo(notifInfo);

                personInfo.MYNO = undefined; // 個人番号
                AppBizDataHolder.setPersonInfo(personInfo);
            }
        }

        // 画面制御初期化
        var pageShowInit = function () {

            // 初期表示時、暗証番号が＊＊＊＊を表示
            $scope.showMask = true;
            // 署名画像
            $scope.showSign = false;

            // 顧客契約情報のデータにて、下記の「変更する」ボタンを非表示する。
            //「顧客契約情報.日興MRF累積投資口座」が「1：契約あり」の場合、「変更する（変更不要日興MRF累積投資口座（証券総合口座取引））」ボタンを非表示する。
            $scope.showBtnNikkoMrf = '1' !== getString(customer.NIKKO_MRF);
            //「顧客契約情報.外国証券取引口座開設日」が「00000000」（未開設）以外の場合、「変更する（変更不要外国証券取引口座）」ボタンを非表示する。
            $scope.showBtnGaikSyknKoza = '00000000' === getString(customer.GAIK_SYKN_KOZA_OPENYMD) || '' === getString(customer.GAIK_SYKN_KOZA_OPENYMD);
            //「顧客契約情報.特定管理口座開設日」が「00000000」（未開設）以外の場合、「変更する（変更不要特定管理口座）」ボタンを非表示する。
            var tkteiKaKoOp = getString(customer.TKTEI_KOZA_OPENYMD);
            $scope.showBtnTkteiKanriKoza = ('' !== tkteiKaKoOp && '00000000' !== tkteiKaKoOp) && ('00000000' === getString(customer.TKTEI_KANRI_KOZA_OPENYMD) || '' === getString(customer.TKTEI_KANRI_KOZA_OPENYMD));
            //「顧客契約情報.加入者情報拡張情報」が空白の場合、「変更する（変更不要加入者拡張情報）」ボタンを非表示する。
            $scope.showBtnKakuKyaknmKnj = !('' === getString(customer.KAKU_KYAKNM_KNJ) && '' === getString(customer.KAKU_YUBINNO) && '' === getString(customer.KAKU_ADDR));
            //「顧客契約情報.マイナンバー告知が「1:申告済」の場合、「変更する（変更不要個人番号告知）」ボタンを非表示する。
            $scope.showBtnMynoKkc = '1' !== getString(customer.MYNO_KKC);
            // 顧客契約情報の利金・分配金支払方法銘柄包括指定区分（SUKN_SITEI_K）が"1：個別"、または"3：包括＆銘柄"以外の場合、「利金・分配金支払方法（銘柄）」の変更するボタンを非表示にする。
            // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
            // 顧客契約情報のホスト帳票閲覧店権限管理チェック結果が"1：ホスト帳票閲覧店権限あり"の場合は「利金・分配金支払方法（銘柄）」の変更するボタンを表示する
            $scope.showBtnSuknSiteiK = ('1' == getString(customer.SUKN_SITEI_K) || '3' == getString(customer.SUKN_SITEI_K)) && '1' == getString(customer.CHOHYO_ETRN_CHK);
            // 顧客契約情報のホスト帳票閲覧店権限管理チェック結果が"1：ホスト帳票閲覧店権限あり"の場合、「利金・分配金支払方法（包括）」の変更するボタンを表示する。
            $scope.showBtnSuknSiteiHktK = '1' == getString(customer.CHOHYO_ETRN_CHK);
            // 顧客契約情報のホスト帳票閲覧店権限管理チェック結果が"1：ホスト帳票閲覧店権限あり"の場合、「外国証券の円貨利金分配金振込銀行」の変更するボタンを表示する。
            $scope.showBtnGaikSyknYen = '1' == getString(customer.CHOHYO_ETRN_CHK)
            // 顧客契約情報のホスト帳票閲覧店権限管理チェック結果が"1：ホスト帳票閲覧店権限あり"の場合、「累投（株投型）分配金買付停止」の変更するボタンを表示する。
            $scope.showBtnRuitouSyknKaitTeis = '1' == getString(customer.CHOHYO_ETRN_CHK)
            // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913
            // NISA口座開設について、NISA開設済み顧客（”00000000”以外）の場合、変更するボタンを非表示にしてください。
            $scope.showBtnNisaKozaOpenymd = '00000000' == getString(customer.NISA_KOZA_OPENYMD);
            // // 外国証券の円貨利金分配金振込銀行”包括なし””銘柄なし”状態の場合、支払方法の選択は全て不可となるため ”変更する”ボタンを非表示にする。
            // var gaikSyknYenSuknBkHktBeforeIsNasi = (strConst.EMPTY_CHAR == getString(customer.GAIK_SYKN_YEN_SUKN_BK_HKT) || undefined == getString(customer.GAIK_SYKN_YEN_SUKN_BK_HKT));
            // var gaikBankMeig = getObject(customer.GAIK_SYKN_YEN_SUKN_BK_MEIG);
            // var gaikSyknYenSuknBkMeigBeforeIsNasi = !angular.isArray(gaikBankMeig) || gaikBankMeig.length === 0;
            // $scope.showBtnGaikSukn = (gaikSyknYenSuknBkHktBeforeIsNasi && gaikSyknYenSuknBkMeigBeforeIsNasi) ? false : true;
        }

        var pageEventInit = function () {

            $scope.btnShowPwd = function () {
                logicCom.btnTapLog(pageId.PAGE_ID, pageId.PAGE_ID, $scope.pwdShowBtnLab);
                $scope.showMask = !$scope.showMask;
                if ($scope.showMask) {
                    $scope.pwdShowBtnLab = strConst.PIN_BUTTON_LABEL_DISP;
                } else {
                    $scope.pwdShowBtnLab = strConst.PIN_BUTTON_LABEL_HIDDEN;
                }
            };

            var scrollLock = function () {
                $(window).on('touchmove.noScroll', function (e) { e.preventDefault(); });
                $('.scrollArea').css({ '-webkit-overflow-scrolling': 'auto' });
                $('.scrollArea').css({ 'overflow': 'hidden' });
            }
            var scrollUnlock = function () {
                $(window).off('.noScroll');
                $('.scrollArea').css({ '-webkit-overflow-scrolling': 'touch' });
                $('.scrollArea').css({ 'overflow': 'scroll' });
            }

            // 「.modal-open」をクリック
            $('[data-target]').click(function () {
                if ($scope.pageErrCtl.wholeHasError || inputSignBtnClicked) { return }

                $timeout(function(){
                    if(inkCanvas){
                        inkCanvas.clearInk();
                    }
                    $scope.isShowSubmit = false;
                })
                
                if ($(this).attr('data-target') === '#G1240-02') {
                    // 背景固定
                    scrollLock();
                    if (!document.getElementById('signModal-overlay')) {
                        // オーバーレイ用の要素を追加
                        $('body').append("<div id='signModal-overlay' class='modal-overlay'></div>");
                        // オーバーレイをフェードイン
                        $('.modal-overlay').fadeIn('fast');
                    }
                    // モーダルコンテンツのIDを取得
                    var modal1 = $(this).attr('data-target');
                    // モーダルコンテンツフェードイン
                    $(modal1).fadeIn('fast');
                }
            });

            // 自動的に画面全体のドラッグや選択を不可能にする機能はオフ
            InkTool.InkCanvasLib.setPreventDragAndSelect(false);
            var inkCanvas;
            var inkPen = new InkTool.SolidPen();              // 等幅ペン
            inkPen.setPenWidth(1);                            // ペンの太さを設定
            inkPen.setPenColor(new InkTool.InkColor('#000')); // ペン色を設定

            // ペンアップ時に呼び出されるハンドラ
            var handlePenUp = function () {
                $scope.isShowSubmit = true;
                $scope.$apply();
            }

            $scope.canvasclear = function () {
                // アクションログ出力
                logicCom.btnTapLog(pageId.PAGE_ID_SIGN, pageId.PAGE_ID_SIGN, 'すべて削除');
                $timeout(function () {
                    inkCanvas.clearInk();
                    $scope.isShowSubmit = false;
                })
            };

            var errOrder = [
                {'sort': 95, 'name': '日興カード', 'flag': $scope.pageErrCtl.errNikoCardPin},
                {'sort': 388, 'name': '個人番号', 'flag': $scope.pageErrCtl.errMynumber || $scope.pageErrCtl.errMynumberCard},
                {'sort': 390, 'name': '本人確認書類', 'flag': $scope.pageErrCtl.errSyuruiTitle || ( !honinKakninSyJoho.HONIN_KAKNIN_SY_K_1 && $scope.pageErrCtl.errMynumberCard )},
                {'sort': 391, 'name': `本人確認書類（${$scope.dataMosikomi.HONIN_KAKNIN_SY_K_1}）`, 'flag': !!honinKakninSyJoho.HONIN_KAKNIN_SY_K_1 && $scope.pageErrCtl.errMynumberCard},
                {'sort': 400, 'name': `本人確認書類（${$scope.dataMosikomi.HONIN_KAKNIN_SY_K_2}）`, 'flag': !!honinKakninSyJoho.HONIN_KAKNIN_SY_K_2 && $scope.pageErrCtl.errMynumberCard},
            ];

            var errMsgParam = {[pageId.PAGE_ID]: {'msgId': $scope.pageErrMsg.wholeErrMsgId}};

            // エラー項目ダイアログの「閉じる」ボタンタップ時
            $scope.closeErrItemModal = function () {
                logicCom.btnTapLog(pageId.PAGE_ID_ERR, pageId.PAGE_ID, '閉じる');
                // ぼかしの背景を消すため、bodyにクラスを削除
                $('body').removeClass('is-modal-open');
                $('#errItemModal').modal('hide');
                scrollUnlock();
                inputSignBtnClicked = false;
            };

            // 署名画面連打防止
            var inputSignBtnClicked = false;

            // 「署名する」ボタンタップ時
            $scope.inputSignBtnClick = function () {

                if(inputSignBtnClicked){
                    return;
                }
                inputSignBtnClicked = true;

                if ($scope.pageErrCtl.wholeHasError) {

                    logicCom.btnTapErrLog(pageId.PAGE_ID, pageId.PAGE_ID_ERR, '署名する', errMsgParam);

                    $scope.errItemList = errOrder.filter(function (tar) { return tar.flag });

                    $('#errItemModal').modal('show');
                    // ぼかしの背景のため、bodyにクラスを追加
                    $('body').addClass('is-modal-open');
                    scrollLock();
                    // ログ出力
                    return;
                }

                // アクションログ出力
                logicCom.btnTapLog(pageId.PAGE_ID, pageId.PAGE_ID_SIGN, '署名する');

                // 署名用のinktoolを id='canvas'のタグにバインドして生成する
                if(!inkCanvas){
                    inkCanvas = InkTool.InkCanvasLib.createCanvas('canvas', 'auto+sp');
                    inkCanvas.setHandler('penup', handlePenUp);
                    inkCanvas.setPen(inkPen);
                }
            }

            // 「署名」の「変更する」ボタンタップ時
            $scope.editSignBtnClick = function () {

                if(inputSignBtnClicked){
                    return;
                }
                inputSignBtnClicked = true;

                // アクションログ出力
                logicCom.btnTapLog(pageId.PAGE_ID, pageId.PAGE_ID_SIGN, '変更する');
            }

            // 「署名」の「戻る」ボタンタップ時
            $scope.modalBackBtnClick = function () {

                if(!inputSignBtnClicked){
                    return;
                }
                inputSignBtnClicked = false;
                // アクションログ出力
                logicCom.btnTapLog(pageId.PAGE_ID_SIGN, pageId.PAGE_ID, '戻る');

                inkCanvas.clearInk();
                // 背景固定解除
                scrollUnlock();
                // オーバーレイを削除
                $('.modal-overlay').remove();
                $('#G1240-02').fadeOut('fast');
            };

            // 「署名」の「確定」ボタンタップ時
            $scope.modalConfirmBtnClick = function () {

                if(!inputSignBtnClicked || !$scope.isShowSubmit){
                    return;
                }
                inputSignBtnClicked = false;

                // アクションログ出力
                logicCom.btnTapLog(pageId.PAGE_ID_SIGN, pageId.PAGE_ID, '確定');

                // 署名イメージを取得
                var png = inkCanvas.saveImage('image/png');

                $('.confirmDataArea_signBtn').remove();

                // inkデータ保存
                var inkData = inkCanvas.saveInk();
                // 署名画像設定する
                var regExpDelete = new RegExp('data:image/png;base64,', 'g');

                // 「G1240-01：お客様確認画面」.「画面項目No413：署名画像」へ設定
                imageData.SYM_GAZO = png.replace(regExpDelete, '');
                imageData.SYM_STRK = inkData;

                // 申込データに事前に最新の位置情報を仮設定
                var locationData = getObject(AppBizDataHolder.getLocation());
                var moskmHsk = getObject(notifInfo.MOSKM_HSK);
                moskmHsk.IDO = locationData.IDO;
                moskmHsk.KEIDO = locationData.KEIDO;
                notifInfo.MOSKM_HSK = moskmHsk;
                AppBizDataHolder.setNotifInfo(notifInfo);

                AppComDevice.getDeolocation(function (result) {
                    // 申込データ（口座開設）＞申し込み補足情報 ＞ 緯度・経度設定
                    moskmHsk.IDO = result.coords.latitude;
                    moskmHsk.KEIDO = result.coords.longitude;
                    notifInfo.MOSKM_HSK = moskmHsk;
                    AppBizDataHolder.setNotifInfo(notifInfo);
                    // 位置情報 ＞ 緯度・経度設定
                    locationData.IDO = result.coords.latitude;
                    locationData.KEIDO = result.coords.longitude;
                    AppBizDataHolder.setLocation(locationData);
                }, function (e) {
                    logicCom.warnLog('「APPCOM-0002：端末情報共通のGPS情報を取得」処理失敗', e);
                });

                $scope.symGazou = png;
                $scope.showSign = true;

                inkCanvas.clearInk();
                // 背景固定解除
                scrollUnlock();
                // オーバーレイを削除
                $('.modal-overlay').remove();
                $('#G1240-02').fadeOut('fast');
            };

            var emptyCallbackFLG = function () {};
            // 画面制御 二重制御
            var editedPath = false;
            // 通信エラー発生する場合、「閉じる」ボタン押下時に、「画面制御 二重制御」フラグを解除する
            var connectionErrorCallback = function () {
                editedPath = false;
            };

            // 「本人確認書類の開始画面」へ遷移する。
            var backPhoto = function (tarPath, fromId, tapBtn) {
                var successCallBack = function () {
                    if (inkCanvas) {
                        inkCanvas.setHandler('penup', emptyCallbackFLG);
                        inkCanvas = null;
                    }
                    var flowControlFlg = getObject(AppBizDataHolder.getFlowControlFlg());
                    var flgCtl = getObject(flowControlFlg.CAMERA_FLG_CONTROL);
                    flgCtl.MOD_FLG = true;
                    if (tarPath == pathConst.SELN_PATH) {
                        flgCtl.MOD_ID_FLG = false;
                    } else {
                        flgCtl.MOD_ID_FLG = true;
                        flgCtl.SKIP_MASK_FLG = false;
                        flgCtl.SKIP_MASK_FLG2 = false;
                    }
                    flowControlFlg.CAMERA_FLG_CONTROL = flgCtl;
                    AppBizDataHolder.setFlowControlFlg(flowControlFlg);
                };
                // 「本人確認書類の開始画面」へ遷移する。
                logicCom.locationPath(pathConst.SELI_PATH + '/' + pathConst.BASE_PATH, successCallBack, emptyCallbackFLG, connectionErrorCallback);
                // アクションログ出力
                logicCom.btnTapLog(fromId, pageId[pathConst.SELI_PATH], tapBtn);
            }

            // 入力画面へ遷移
            var backInfo = function (tarPath, fromId, tapBtn, id?) {
                var successCallBack = function () {
                    if (inkCanvas) {
                        inkCanvas.setHandler('penup', emptyCallbackFLG);
                        inkCanvas = null;
                    }
                };
                if (id) {
                    logicCom.locationPath(tarPath + '/' + pathConst.BASE_PATH + '/' + id, successCallBack, emptyCallbackFLG, connectionErrorCallback);
                } else {
                    logicCom.locationPath(tarPath + '/' + pathConst.BASE_PATH, successCallBack, emptyCallbackFLG, connectionErrorCallback);
                }
                // アクションログ出力
                logicCom.btnTapLog(fromId, pageId[tarPath], tapBtn);
            }

            // 入力画面へ遷移する処理
            var editPath = function (tarPath, fromId, tapBtn, id) {
                switch (tarPath) {
                    case pathConst.PIN_PATH:
                        backInfo(tarPath, fromId, tapBtn);
                        break;
                    case pathConst.INPUT_PATH:
                        backInfo(tarPath, fromId, tapBtn, id);
                        break;
                    case pathConst.SELN_PATH:
                    case pathConst.SELI_PATH:
                        backPhoto(tarPath, fromId, tapBtn);
                        break;
                }
            };

            var backTarget = strConst.EMPTY_CHAR;
            var backTargetId = strConst.EMPTY_CHAR;
            // イベント：入力元画面に戻る
            $scope.editBtnClick = function (target, id) {

                // 署名欄解除
                // 背景固定解除
                scrollUnlock();
                // オーバーレイを削除
                $('.modal-overlay').remove();
                $('#G1240-02').fadeOut('fast');
                inputSignBtnClicked = false;

                if(inkCanvas){
                    inkCanvas.clearInk();
                }

                if(editedPath){
                    return;
                }
                editedPath = true;

                if ($scope.showSign) {
                    backTarget = target;
                    backTargetId = id;
                    // モーダル表示
                    $('#G1240-03').modal('show');
                    // ぼかしの背景のため、bodyにクラスを追加
                    $('body').addClass('is-modal-open');
                    scrollLock();
                    // アクションログ出力
                    logicCom.btnTapLog(pageId.PAGE_ID, pageId.PAGE_ID_EDIT, '変更する');
                } else {
                    // 入力元画面へ遷移する
                    editPath(target, pageId.PAGE_ID, '変更する', id);
                }
            };

            $scope.editNo = function () {

                if(!editedPath){
                    return;
                }
                editedPath = false;

                backTarget = strConst.EMPTY_CHAR;
                backTargetId = strConst.EMPTY_CHAR;
                $('body').removeClass('is-modal-open');
                scrollUnlock();
                // アクションログ出力
                logicCom.btnTapLog(pageId.PAGE_ID_EDIT, pageId.PAGE_ID, 'いいえ');
            };

            $scope.editYes = function () {

                if(!editedPath){
                    return;
                }
                editedPath = false;

                // モーダル閉じる
                $('#G1240-03').modal('hide');
                $('body').removeClass('is-modal-open');
                scrollUnlock();
                // 入力元画面へ遷移する
                editPath(backTarget, pageId.PAGE_ID_EDIT, 'はい', backTargetId);
            };

            // イベント：次画面に進む
            $scope.confirm = function () {

                if(editedPath){
                    return;
                }
                editedPath = true;
                
                var successCallBack = function () {
                    if (inkCanvas) {
                        inkCanvas.setHandler('penup', emptyCallbackFLG);
                        inkCanvas = null;
                    }
                };

                // アクションログ出力
                logicCom.btnTapLog(pageId.PAGE_ID, pageId.PAGE_ID_NEXT, '確定');
                AppBizDataHolder.setImageData(imageData);
                logicCom.locationPath('finalConfirmDescription', successCallBack, emptyCallbackFLG, connectionErrorCallback);
            };
        }

        var initAll = function () {
            loadApplyInfo();
            pageInit();
            errorCheck();
            pageShowInit();
            pageEventInit();

            $scope.$on('$viewContentLoaded', function () {
                $timeout(function () {
                    $anchorScroll.yOffset = 0;
                    $anchorScroll();
                }, 0);
            });
        }

        initAll();

        $scope.$on('$destroy', function() {
            $scope = null;
        });
    }]);