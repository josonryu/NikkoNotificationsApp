/// <reference path="../reference.d.ts" />

App.controller('finalConfirmController', ['$scope', '$controller', 'AppBizDataHolder', 'logicCom', 'AppBizMsg', 'AppLgcMultiCheck', 'AppComDevice',
    function ($scope, $controller, AppBizDataHolder, logicCom, AppBizMsg, AppLgcMultiCheck, AppComDevice) {

        // 確認画面共通
        $controller('confirmCommon', { $scope: $scope });
        // 詳細リンク
        $controller('detailModalController', { $scope: $scope });

        var strCst = {
            EMPTY_CHAR: '', //空文字
            ONE: '1',// 1
            BASE64_HEAD: 'data:image/png;base64,', // BASE64ヘッダー

            PAGE_ID_PREV: 'G1240-01', // お客様確認画面
            PAGE_ID: 'G1260-01', // 営業員確認画面ID
            PAGE_ID_COMP: 'G1260-03', // 営業員確認完了画面
            PAGE_ID_ERR: 'G1260-04', // 営業員確認のエラー項目表示画面
            PAGE_ID_RETURN: 'G1260-05', // お客様確認への遷移確認画面
            PAGE_ID_NEXT: 'G1270-01', // お申し込み送信中画面

            PAGE_NAME_NEXT: 'applicationComp', // お申し込み送信中画面
            PAGE_NAME_PREV: 'applicationConfirm', // お客様確認画面

            KOFU_HSK: 'KOFU_HSK', // MRF目論見書の交付方式項目名
            EIGYOIN_BIKO: 'EIGYOIN_BIKO', // 備考項目名
            TANTEIGY_KAKARI_C: 'TANTEIGY_KAKARI_C' // 担当営業員係コード項目名
        }

        /**
         * 文字列を取得
         * @param {string | number} target
         */
        var getString = function (target) {
            return (target || target === +target) ? target + strCst.EMPTY_CHAR : strCst.EMPTY_CHAR;
        }

        /**
         * 対象を取得
         * @param {Object} obj 
         */
        var getObject = function (obj) {
            return angular.isObject(obj) ? angular.copy(obj) : {};
        }

        // CD-001:申込データ（口座開設）
        var notifInfo: any = {};

        // CD-003:画像データ
        var imageData: any = {};

        // CD-008:画面遷移制御用フラグ -> 入力画面遷移制御
        var inputFlgControl: any = {};

        // 画面初期化
        var pageViewInit = function () {

            // CD-003:画像データ
            imageData = getObject(AppBizDataHolder.getImageData());
            // 署名画像
            var syaGazo = getString(imageData.SYM_GAZO);
            $scope.signViewData = strCst.BASE64_HEAD + syaGazo;
            $scope.showSignViewData = !!syaGazo;

            // CD-001:申込データ（事務手続き）
            notifInfo = getObject(AppBizDataHolder.getNotifInfo());
            // 本人確認書類クリアの場合
            $scope.clearSyuruiJoho = !getObject(notifInfo.HONIN_KAKNIN_SY_JOHO).HONIN_KAKNIN_SY_K_1;
            // 日興カード暗証番号クリアの場合
            $scope.clearPinJoho = !getObject(notifInfo.PIN_JOHO).NIKKO_CARD_PIN;
            // 個人番号クリアの場合
            $scope.clearMynumberJoho = !getObject(AppBizDataHolder.getPersonInfo()).MYNO;
            // 事務手続き情報
            var jimuJoho = getObject(notifInfo.JIMU_JOHO);

            // CD-008:画面遷移制御用フラグ
            var flowControlFlg = getObject(AppBizDataHolder.getFlowControlFlg());
            // CD-008:画面遷移制御用フラグ -> 入力画面遷移制御
            inputFlgControl = getObject(flowControlFlg.INPUT_FLG_CONTROL);

            //  画面遷移制御用フラグ.入力画面遷移制御.日興MRF変更フラグ：　true かつ 日興MRF累積投資口座（証券総合口座取引）の「申し込む」を選択した場合
            //  MRF目論見書の交付方式
            $scope.showKofuHsk = '1' === getString(inputFlgControl.NIKKO_MRF_F) && '1' === getString(jimuJoho.NIKKO_MRF);

            // 画面初期化
            $scope.MODEL = {};
        }
        // エラーチェック
        var errorCheck = function () {

            // 既契約顧客情報
            var customer = getObject(AppBizDataHolder.getCustomer());

            // 注意喚起文言（おなまえ） 注意喚起文言（ご住所）
            // 顧客契約情報.マル優・マル特契約状態が「1:マル優・特マル契約」の場合表示する
            $scope.showMaruyuKMsg = '1' === getString(customer.MARUYU_K);

            // 注意喚起文言（おなまえ）
            // 顧客契約情報.振替株式の配当金等の証券口座受取申込（配当金受領方式）が「2:株式数比例配分方式」以外の場合表示する
            $scope.showHireiHaiBunMsg = '2' !== getString(customer.HIREIHAIBUN) && '0' !== getString(customer.HIREIHAIBUN);

            // 注意喚起文言（おなまえ） 注意喚起文言（ご住所）
            // 顧客契約情報.加入者情報拡張情報が「undefined」ではない場合表示する
            $scope.showKakuKyakMsg = !!(getString(customer.KAKU_KYAKNM_KNJ) || getString(customer.KAKU_YUBINNO) || getString(customer.KAKU_ADDR));

            // 注意喚起文言（ご住所）
            // 顧客契約情報.送付先新郵便番号、顧客契約情報.送付先住所漢字、顧客契約情報.送付先住所カナ、いずれかが「undefined」ではない場合表示する
            $scope.showSouHuSaKiMsg = !!(getString(customer.SOUHUSAKI_YBN_BNG) || getString(customer.SOUHUSAKI_JYSY_KNJ) || getString(customer.SOUHUSAKI_JYSY_KN));

            $scope.showCheckAdd = $scope.showMaruyuKMsg || $scope.showKakuKyakMsg || $scope.showSouHuSaKiMsg;

            $scope.getMsg = function (msgId) {
                return getString(AppBizMsg.getMsg(msgId, undefined));
            };
        }

        // 入力チェック初期化
        var pageCheckInit = function () {

            // 画面入力項目定義
            var inputData = {
                [strCst.KOFU_HSK]: {
                    applyName: strCst.KOFU_HSK, // 項目の共通領域名
                    id: 'radioMRFDelivery', // 画面項目id
                    name: 'MRF目論見書の交付方式', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [['isEmpty']] // 一括チェック仕様（画面遷移時）
                },
                [strCst.EIGYOIN_BIKO]: {
                    applyName: strCst.EIGYOIN_BIKO, // 項目の共通領域名
                    id: 'txtTanBiko', // 画面項目id
                    name: '備考', // 画面項目名
                    typeSelect: false, // 入力項目タイプ
                    requireString: 'full', // 文字変換タイプ
                    handWrite: 'text_all', // 手書き
                    length: 30, // 最大文字数
                    valChangChk: [['isFullString', 'hasForbidChar', 'chkMaxLength'], ['hasSimilar']], // 随時入力チェック仕様（値変更時）
                    allChk: [['isFullString', 'hasForbidChar', 'chkMaxLength']], // 一括チェック仕様（画面遷移時）
                    similarType: 4
                }
            };

            $scope.input = getObject(inputData);
        }

        // 画面メソッド初期化
        var pageEventInit = function () {

            var emptyCallback = function () { };

            $scope.canConfirm = function () {
                return !(('1' !== getString(inputFlgControl.KYAK_ADDR_F) || !$scope.showCheckAdd || $scope.MODEL.checkAdd) && ('1' !== getString(inputFlgControl.KYAKNM_F) || $scope.MODEL.checkName));
            }

            // 画面二重クリック制御
            var btnClicked = false;

            // 通信エラー発生する場合、「閉じる」ボタン押下時に、「画面制御 二重制御」フラグを解除する
            var connectionErrorCallback = function () {
                btnClicked = false;
            };

            // 画面背景固定
            var scrollLock = function () {
                btnClicked = true;
                // ぼかしの背景のため、bodyにクラスを追加
                $('body').addClass('is-modal-open');
                $('.scrollArea').css({ '-webkit-overflow-scrolling': 'auto' });
            }

            // 画面背景解放
            var scrollUnlock = function () {
                btnClicked = false;
                // ぼかしの背景を消すため、bodyにクラスを削除
                $('body').removeClass('is-modal-open');
                $('.scrollArea').css({ '-webkit-overflow-scrolling': 'touch' });
            }

            // エラー項目ダイアログ 項目表示順番
            var errOrder = [{ sort: 1, name: 'MRF目論見書の交付方式', id: strCst.KOFU_HSK, isLinkItem: false },
            { sort: 2, name: '備考', id: strCst.EIGYOIN_BIKO, isLinkItem: false },
            { sort: 3, name: '備考', id: strCst.EIGYOIN_BIKO, isLinkItem: true }];

            // エラー項目ダイアログの「閉じる」ボタンタップ時
            $scope.closeErrItemModal = function () {
                scrollUnlock();
                logicCom.btnTapLog(strCst.PAGE_ID_ERR, strCst.PAGE_ID, '閉じる');
                $('#errItemModal').modal('hide');
            };

            // G1260-03 営業員確認完了画面
            $scope.confirm = {
                // G1260-01の「次へ」ボタンタップ時
                showModal: function () {
                    if (btnClicked) {
                        return;
                    }
                    scrollLock();
                    // 一括チェックする前に、すべてのエラー情報をクリア
                    AppBizMsg.clearAllErrors();
                    var chkResukt = AppLgcMultiCheck.multiInputCheck($scope.input, $scope.MODEL);

                    if ('1' === getString(inputFlgControl.KYAKNM_F)) {
                        // おなまえ変更確認区分
                        chkResukt[1].CONFIRM_NAME = { value: $scope.MODEL.checkName };
                    }

                    if ('1' === getString(inputFlgControl.KYAK_ADDR_F) && $scope.showCheckAdd) {
                        // 住所変更確認区分
                        chkResukt[1].CONFIRM_ADDRESS = { value: $scope.MODEL.checkAdd };
                    }

                    if (chkResukt[0]) {
                        logicCom.btnTapErrLog(strCst.PAGE_ID, strCst.PAGE_ID_ERR, '次へ', chkResukt[1])
                        $scope.errItemList = errOrder.filter(function (tar) {
                            var resultItem = chkResukt[1][tar.id];
                            if (!resultItem) {
                                return false;
                            }
                            return tar.isLinkItem ? resultItem.linkChkErr : resultItem.chkErr;
                        });
                        // G1260-04 営業員確認のエラー項目表示画面
                        $('#errItemModal').modal('show');
                        return;
                    }

                    logicCom.btnTapLog(strCst.PAGE_ID, strCst.PAGE_ID_COMP, '次へ', chkResukt[1]);
                    // G1260-03 営業員確認完了画面
                    $("#" + strCst.PAGE_ID_COMP).modal("show");
                },
                // G1260-03の「いいえ」ボタンタップ時
                no: function () {
                    if (!btnClicked) {
                        return;
                    }
                    scrollUnlock();
                    logicCom.btnTapLog(strCst.PAGE_ID_COMP, strCst.PAGE_ID, 'いいえ');
                },
                // G1260-03の「はい」ボタンタップ時 
                yes: function () {
                    if (!btnClicked) {
                        return;
                    }
                    scrollUnlock();
                    logicCom.btnTapLog(strCst.PAGE_ID_COMP, strCst.PAGE_ID_NEXT, 'はい', undefined, true);

                    // 営業員情報
                    var eigyoinJoho = getObject(notifInfo.EIGYOIN_JOHO);
                    // MRF目論見書の交付方式
                    eigyoinJoho[strCst.KOFU_HSK] = getString($scope.MODEL.KOFU_HSK);
                    // 備考
                    eigyoinJoho[strCst.EIGYOIN_BIKO] = getString($scope.MODEL.EIGYOIN_BIKO);
                    // 申し込み補足情報
                    var moskmHsk = getObject(notifInfo.MOSKM_HSK);
                    // UUID
                    moskmHsk.UUID = AppComDevice.getUuid();

                    notifInfo.EIGYOIN_JOHO = eigyoinJoho;
                    notifInfo.MOSKM_HSK = moskmHsk;

                    // 営業員確認情報
                    var eigyoinKakJoho = getObject(notifInfo.EIGYOIN_KAKNIN_JOHO);

                    // 営業員確認情報.氏名変更時のマル優・特別マル優確認区分
                    eigyoinKakJoho.NM_MARUYU_K = strCst.EMPTY_CHAR;

                    // 営業員確認情報.氏名変更時の関係書類の再受入れ確認区分
                    eigyoinKakJoho.SAIUKEIRE_K = strCst.EMPTY_CHAR;

                    // 営業員確認情報.氏名変更時の外貨振込先口座名再登録確認区分
                    eigyoinKakJoho.GAIKA_KOZA_SAITRK_K = strCst.EMPTY_CHAR;

                    // 営業員確認情報.氏名変更時の届出印確認区分
                    eigyoinKakJoho.SEAL_K = strCst.EMPTY_CHAR;

                    // 営業員確認情報.氏名変更時の配当金受領方式確認区分
                    eigyoinKakJoho.HAITKN_K = strCst.EMPTY_CHAR;
                    
                    // 営業員確認情報.氏名変更時の拡張登録変更確認区分
                    eigyoinKakJoho.EXPTRKHNK_K = strCst.EMPTY_CHAR;

                    // 営業員確認情報.住所変更時の拡張登録変更確認区分
                    eigyoinKakJoho.JYS_EXPTRKHNK_K = strCst.EMPTY_CHAR;

                    // 営業員確認情報.住所変更時のマル優・特別マル優確認区分
                    eigyoinKakJoho.JYS_MARUYU_K = strCst.EMPTY_CHAR;

                    // 営業員確認情報.住所変更時の送付先変更確認区分
                    eigyoinKakJoho.SENDSK_HNK_K = strCst.EMPTY_CHAR;

                    if ('1' === getString(inputFlgControl.KYAKNM_F)) {

                        // 営業員確認情報.氏名変更時のマル優・特別マル優確認区分
                        if ($scope.showMaruyuKMsg) {
                            eigyoinKakJoho.NM_MARUYU_K = strCst.ONE;
                        }
    
                        // 営業員確認情報.氏名変更時の関係書類の再受入れ確認区分
                        eigyoinKakJoho.SAIUKEIRE_K = strCst.ONE;
    
                        // 営業員確認情報.氏名変更時の外貨振込先口座名再登録確認区分
                        eigyoinKakJoho.GAIKA_KOZA_SAITRK_K = strCst.ONE;
    
                        // 営業員確認情報.氏名変更時の届出印確認区分
                        eigyoinKakJoho.SEAL_K = strCst.ONE;
    
                        // 営業員確認情報.氏名変更時の配当金受領方式確認区分
                        if ($scope.showHireiHaiBunMsg) {
                            eigyoinKakJoho.HAITKN_K = strCst.ONE;
                        }
    
                        // 営業員確認情報.氏名変更時の拡張登録変更確認区分
                        if ($scope.showKakuKyakMsg) {
                            eigyoinKakJoho.EXPTRKHNK_K = strCst.ONE;
                        }
                    }

                    if ('1' === getString(inputFlgControl.KYAK_ADDR_F)) {

                        // 営業員確認情報.住所変更時の拡張登録変更確認区分
                        if ($scope.showKakuKyakMsg) {
                            eigyoinKakJoho.JYS_EXPTRKHNK_K = strCst.ONE;
                        }
    
                        // 営業員確認情報.住所変更時のマル優・特別マル優確認区分
                        if ($scope.showMaruyuKMsg) {
                            eigyoinKakJoho.JYS_MARUYU_K = strCst.ONE;
                        }
    
                        // 営業員確認情報.住所変更時の送付先変更確認区分
                        if ($scope.showSouHuSaKiMsg) {
                            eigyoinKakJoho.SENDSK_HNK_K = strCst.ONE;
                        }
                    }

                    notifInfo.EIGYOIN_KAKNIN_JOHO = eigyoinKakJoho;

                    var successCallBack = function () {
                        AppBizDataHolder.setNotifInfo(notifInfo);
                    };
                    // 「G1270-01：お申し込み送信中画面」に遷移する
                    logicCom.locationPath(strCst.PAGE_NAME_NEXT, successCallBack, emptyCallback, connectionErrorCallback);
                },
            };

            // G1260-05：お客様確認への遷移確認画面
            $scope.return = {
                // G1260-01の「戻る」ボタンタップ時
                showModal: function () {
                    if (btnClicked) {
                        return;
                    }
                    scrollLock();
                    logicCom.btnTapLog(strCst.PAGE_ID, strCst.PAGE_ID_RETURN, '戻る');
                    // G1260-05：お客様確認への遷移確認画面
                    $("#" + strCst.PAGE_ID_RETURN).modal("show");
                },
                // G1260-05の「いいえ」ボタンタップ時
                no: function () {
                    if (!btnClicked) {
                        return;
                    }
                    scrollUnlock();
                    logicCom.btnTapLog(strCst.PAGE_ID_RETURN, strCst.PAGE_ID, 'いいえ');
                },
                // G1260-05の「はい」ボタンタップ時
                yes: function () {
                    if (!btnClicked) {
                        return;
                    }
                    scrollUnlock();
                    logicCom.btnTapLog(strCst.PAGE_ID_RETURN, strCst.PAGE_ID_PREV, 'はい');

                    var successCallBack = function () {
                        // 署名画像
                        imageData.SYM_GAZO = undefined;
                        // ストローク情報
                        imageData.SYM_STRK = undefined;

                        AppBizDataHolder.setImageData(imageData);
                    };
                    // 「G1240-01：お客様確認画面」に遷移する
                    logicCom.locationPath(strCst.PAGE_NAME_PREV, successCallBack, emptyCallback, connectionErrorCallback);
                },
            };
        }

        var initAll = function () {
            pageViewInit();
            errorCheck();
            pageCheckInit();
            pageEventInit();
        }

        initAll();

        $scope.$on('$destroy', function() {
            $scope = null;
        });
    }]);