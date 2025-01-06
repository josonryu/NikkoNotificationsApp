/// <reference path="../reference.d.ts" />

App.controller('selectCustomerController', ['$scope','$location','$controller', 'AppCom','AppBizCom','appConst','logicCom','APL_NAME', 'AppLgcMultiCheck', 'AppBizDataHolder','AppBizMsg',
function ($scope,$location,$controller, AppCom,AppBizCom,appConst,logicCom,APL_NAME, AppLgcMultiCheck, AppBizDataHolder, AppBizMsg) {

    /** 画面ID */
    var GAMEN_THIS = { ID: 'G1060-01', NAME: 'selectCustomer' }      //お客様検索
    var GAMEN_NEXT = { ID: 'G1060-02', NAME: 'resultCustomer' }      //お客様検索結果
    var GAMEN_PREV = { ID: 'G1050-01', NAME: 'selectPlace' }         //受付場所の選択

    /** ボタン名／名称 */
    var BTN_SEARCH = '検索';
    var BTN_PREV = '戻る';

    /** ボタン連打防止フラグ */
    var stopBtnEventFLG = false;
    var callbackFLG = function () { };
    // 通信エラー発生する場合、「閉じる」ボタン押下時に、「画面制御 二重制御」フラグを解除する
    var connectionErrorCallback = function () {
        stopBtnEventFLG = false;
    };

    /** サービス時間情報 **/
    var serviceTime: any = AppBizCom.DataHolder.getServiceTime();

    /** システムエラー. */
    var ERR_SYSTEM = {
        TITLE: AppBizCom.Msg.getMsg('KKAP-CM000-06E', []),
        CONTENTS: AppBizCom.Msg.getMsg('KKAP-CM000-07E', [])
    };
    /** サービス時間外. */
    var ERR_SERVICE_TIME = {
        TITLE: AppBizCom.Msg.getMsg('KKAP-CM000-13E', []),
        CONTENTS: AppBizCom.Msg.getMsg('KKAP-CM000-14E', [APL_NAME, serviceTime.SRVC_KS_ZKK, serviceTime.SRVC_SYRY_ZKK]),
    };

    /** 既契約顧客情報検索条件 */
    $scope.condition = {
        kouzaShiten: { val: '' },
        kouzaBango:  { val: '' },
    }

    /** 相関チェックエラー */
    var MSG_01E = 'KKAP-SF004-01E'; //お客さま検索の「結果コード値」が「-2:仲介業者チェックエラー」の場合
    var MSG_02E = 'KKAP-SF004-02E'; //お客さま検索の「結果コード値」が「-4:ホスト帳票閲覧店権限管理チェックエラー」の場合
    var MSG_03E = 'KKAP-SF004-03E'; //お客さま検索の「結果コード値」が「-1:取得結果なし（0件）」の場合
    var MSG_04E = 'KKAP-SF004-04E'; //お客さま検索の「結果コード値」が上記または「-98:オフライン中」または「-99:その他エラー」以外の場合

    var AppBizInputCheck = AppBizCom.InputCheck;

    /** エラーメッセージ表示領域 */
    var errCD = '';
    var msg = '';


        // 相関チェックエラークリア処理
        var errorCheckStore = function () {
            if (errCD != '') {
                AppBizCom.Msg.clearAllErrors();
                errCD = '';
            }
        };
        // 相関チェックエラークリア処理
        var errorCheckCustomer = function () {
            if (errCD != '') {
                AppBizCom.Msg.clearAllErrors();
                errCD = '';
            }
        };

        // 項目が空になる時に、相関チェックエラークリア
        ['MODEL.MISE_C'].forEach((e, index) => {
            $scope.$watch(e, function (newValue, oldValue) {
                if (newValue !== oldValue && (newValue == undefined || newValue == '')) {
                    if (AppBizCom.InputCheck.isEmpty($scope.MODEL.MISE_C)) {
                        if (errCD != '') {
                            AppBizCom.Msg.clearAllErrors();
                            errCD = '';
                        }
                    }

                };
            });
        });
        // 項目が空になる時に、相関チェックエラークリア
        ['MODEL.KYAK_CIF_C'].forEach((e, index) => {
            $scope.$watch(e, function (newValue, oldValue) {
                if (newValue !== oldValue && (newValue == undefined || newValue == '')) {
                    if (AppBizCom.InputCheck.isEmpty($scope.MODEL.KYAK_CIF_C)) {
                        if (errCD != '') {
                            AppBizCom.Msg.clearAllErrors();;
                            errCD = '';
                        }
                    }
                };
            });
        });

    var inputData = {
        MISE_C: {
            applyName: 'MISE_C',
            id: 'txtShiten',
            name: '店部課コード',
            typeSelect: false,
            numPad: 'numkeyboard-right',
            onBlurChk: [['isNum'],[errorCheckStore]],
            allChk: [['isEmpty'], ['isNum']],
        },
        KYAK_CIF_C: {
            applyName: 'KYAK_CIF_C',
            id: 'txtBango',
            name: '顧客コード',
            typeSelect: false,
            numPad: 'numkeyboard-right',
            onBlurChk: [['isNum'],[errorCheckCustomer]],
            allChk: [['isEmpty'], ['isNum']],
        },
    }


    /**
     * 初期化処理
     */
    var init = function () {
        // 画面入力項目データをスコープへ設定
        $scope.input = angular.copy(inputData);
    };

    $scope.init = function () {
        /** お客さま客情報の検索条件. */
        $scope.MODEL = {
            /** 口座番号（店部課コード） */
            MISE_C: '',
            /** 口座番号（顧客コード） */
            KYAK_CIF_C: '',
        };

        // 共通部分制御を継承
        $controller('errorInfoModalCtrl', {$scope: $scope});

    };

    /**
     * G1060-01 イベント3：入力処理・入力確定時
     * お客様の口座番号を入力する
     * 　→　属性チェックの随時入力チェックを行う(APPBIZ-C008:入力チェック機能)
     */                           


    /**
     * エラーメッセージ表示
     */
    var showErrorMessage = function () {
        msg = AppBizCom.Msg.getMsg(errCD);
        AppBizCom.Msg.showErrorMsgText('searchBtn', msg);
        AppBizCom.Msg.showErrorItem('txtShiten');
        AppBizCom.Msg.showErrorItem('txtBango');

        // エラーログ出力
        logicCom.btnTapLog(GAMEN_THIS.ID, GAMEN_THIS.ID, BTN_SEARCH, [errCD, msg], false);
    }

    /**
     * イベント3. 3) ②POST処理失敗の場合
     * @param data 
     * @param status 
     */
    var errorCallback = function (data: any, status: any) {

        // インジケータ削除
        $('#overlay').remove();
        $('main').removeClass('loadingCircle_blur');

        // サーバの応答結果を確認
        switch (data && Number(data.RESULT_CODE)) {

            case appConst.SUBIF005.RESULT_CODE.CHUKAI_ERROR:
                // 仲介業者チェックエラー
                errCD = MSG_01E;
                break;

            // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
            //case appConst.SUBIF005.RESULT_CODE.HOST_ERROR:
                // ホスト帳票閲覧店権限管理チェックエラー
                //errCD = MSG_02E;
                //break;
            // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913

            case appConst.SUBIF005.RESULT_CODE.NONE:
                // 取得結果なし（0件）
                errCD = MSG_03E;
                break;

            case appConst.SUBIF005.RESULT_CODE.OFFLINE:
                // オフライン中：サービス終了のお知らせ画面を表示
                $scope.openErrorInfo(ERR_SERVICE_TIME.TITLE, ERR_SERVICE_TIME.CONTENTS);
                logicCom.errorLog('お客さま検索取得サービス時間外エラー', { RESULT_CODE: data.RESULT_CODE, status: status });
                return;

            case appConst.SUBIF005.RESULT_CODE.OTHER_ERROR:
                // その他エラー：システムエラー画面を表示
                $scope.openErrorInfo(ERR_SYSTEM.TITLE, ERR_SYSTEM.CONTENTS);
                logicCom.errorLog('お客さま情報取得その他エラー', { RESULT_CODE: data.RESULT_CODE, status: status });
                return;

            default:
                // 通信エラー
                errCD = MSG_04E;
        };

        stopBtnEventFLG = false;

        return showErrorMessage();
    };


    //イベント3. 3) ①POST処理成功の場合
    var successCallback = function (SUBIF005Recv: any, status: any) {

        // インジケータ削除
        $('#overlay').remove();
        $('main').removeClass('loadingCircle_blur');

        // ステータスが正常以外か結果コード値が取得結果正常と銀行代理業口座開設受付チェック警告以外の場合はエラー
        if (status != appConst.HTTP_OK || (SUBIF005Recv.RESULT_CODE != appConst.SUBIF005.RESULT_CODE.OK && SUBIF005Recv.RESULT_CODE != appConst.SUBIF005.RESULT_CODE.BANK_WORNING) ) {
            // 通信エラー
            return errorCallback(SUBIF005Recv, status);
        }

        // 銀行代理業チェック結果更新用変数を設定
        if (SUBIF005Recv.RESULT_CODE == appConst.SUBIF005.RESULT_CODE.BANK_WORNING) {
            // 結果コード値が-3:銀行代理業口座開設受付チェック警告の場合
            // 銀行代理業口座である
            $scope.DAIRI = 1;
        } else {
            // 結果コード値が-3:銀行代理業口座開設受付チェック警告以外の場合
            // 銀行代理業口座でない
            $scope.DAIRI = 0;
        }

        // 電子帳票データの取得と画面遷移設定
        var subif005Send: any = {
            //'2:事務手続き'を初期値として設定
            APPLY_K: 2,
        }
        $scope.signDataObj = AppBizCom.DataHolder.getEFormInfo();
        if ($scope.signDataObj) {
            //申込区分を'3:電子帳票'で上書き
            subif005Send.APPLY_K = 3;
            
        }

        // 顧客契約情報の設定
        if (subif005Send.APPLY_K == 2) {
            // お客さま情報を共通領域の顧客契約情報に設定（事務手続き）

            // 自宅電話番号（'-'で分割）
            var resultTel = splitTel(SUBIF005Recv.JTK_DNW_BNG);

            // 携帯電話番号（'-'で分割）
            var resultMobile = splitTel(SUBIF005Recv.KTI_DNW_BNG);

            // FAX番号（'-'で分割）
            var resultFax = splitTel(SUBIF005Recv.FAX_BNG);

            var modelObj = {
                MISE_C: SUBIF005Recv.MISE_C,                                                          //店部課コード
                KYAK_CIF_C: SUBIF005Recv.KYAK_CIF_C,                                                  //顧客コード
                KOZA_OPEN_YMD: SUBIF005Recv.KOZA_OPENYMD,                                             //口座開設日
                KAKARI_C: SUBIF005Recv.KAKARI_C,                                                      //係コード
                KYAKNM_SEI_KNJ: SUBIF005Recv.SIMEI_SEI,                                               //顧客姓（漢字）
                KYAKNM_MEI_KNJ: SUBIF005Recv.SIMEI_MEI,                                               //顧客名（漢字）
                KYAKNM_SEI_KANA: SUBIF005Recv.KANA_SEI,                                               //顧客姓（カナ）
                KYAKNM_MEI_KANA: SUBIF005Recv.KANA_MEI,                                               //顧客名（カナ）
                GNGO: SUBIF005Recv.GNGO_K,                                                            //元号
                SEINENYMD: SUBIF005Recv.SEINEN_YMD,                                                   //和暦年月日
                SEX_K: SUBIF005Recv.SEX_K,                                                            //性別区分
                JSYFMI: SUBIF005Recv.ADDR_UNKNOWN,                                                    //住所不明
                TIIKI_C: SUBIF005Recv.CHIKI_CD,                                                       //地域コード
                YUBINNO: SUBIF005Recv.YBN_BNG,                                                        //郵便番号
                KYAK_ADDR_KNJ: SUBIF005Recv.KYAK_JYSY_KNJ,                                            //顧客住所漢字
                KYAK_ADDR_KANA: SUBIF005Recv.KYAK_JYSY_KN,                                            //顧客住所カナ
                KYAK_HOSK_ADDR_KNJ: SUBIF005Recv.HSK_JYSY_KNJ,                                        //補足住所漢字
                KYAK_HOSK_ADDR_KANA: SUBIF005Recv.HSK_JYSY_KN,                                        //補足住所フリガナ
                KYAK_HOUSENM_KNJ: SUBIF005Recv.TTMN_NM_KNJ,                                           //建物名漢字
                KYAK_HOUSENM_KANA: SUBIF005Recv.TTMN_NM_KN,                                           //建物名フリガナ

                MYNO_KKC: SUBIF005Recv.MYNO_NOTICE,                                                   //マイナンバー告知
                MARUYU_K: SUBIF005Recv.MARU_YU,                                                       //マル優・特マル契約状態
                DIRECT_K: SUBIF005Recv.DIRECT_COURSE,                                                 //ダイレクトコース申込
                TELNO1: resultTel[0],                                                                 //自宅電話番号1
                TELNO2: resultTel[1],                                                                 //自宅電話番号2
                TELNO3: resultTel[2],                                                                 //自宅電話番号3
                MOBILE_TELNO1: resultMobile[0],                                                       //携帯電話番号1
                MOBILE_TELNO2: resultMobile[1],                                                       //携帯電話番号2
                MOBILE_TELNO3: resultMobile[2],                                                       //携帯電話番号3
                FAXNO1: resultFax[0],                                                                 //FAX番号1
                FAXNO2: resultFax[1],                                                                 //FAX番号2
                FAXNO3: resultFax[2],                                                                 //FAX番号3
                NIKKO_MRF: SUBIF005Recv.NIKKO_MRF,                                                    //日興MRF累積投資口座
                NIKKO_CARD: SUBIF005Recv.NIKKO_CARD_HKKB,                                             //日興カード発行日
                NIKKO_EZ: SUBIF005Recv.NIKKO_EZ_MSKMB,                                                //日興イージートレード申込日
                DNS_KOFU_SRV: SUBIF005Recv.DNS_KOFU_SRV,                                              //電子交付サービス
                GAIK_SYKN_KOZA_OPENYMD: SUBIF005Recv.GAIK_SYKN_KOZA_OPENYMD,                          //外国証券取引口座開設日
                TKTEI_KOZA_OPENYMD: SUBIF005Recv.TKTEI_KOZA_OPENYMD,                                  //特定口座開設日
                TKTEI_KOZA_AC: SUBIF005Recv.TKTEI_KOZA_AC,                                            //特定口座勘定区分
                TKTEI_KOZA_GNSN: SUBIF005Recv.TKTEI_KOZA_GNSN,                                        //特定口座源徴区分
                TKTEI_KOZA_YYKYMD: SUBIF005Recv.TKTEI_KOZA_YYKYMD,                                    //特定口座源徴予約日
                TKTEI_KOZA_YYK: SUBIF005Recv.TKTEI_KOZA_YYK,                                          //特定口座予約情報
                TKTEI_KOZA_NENSY_TORIHIKIYMD: SUBIF005Recv.TKTEI_KOZA_NENSY_TORIHIKIYMD,              //特定口座年初取引
                TKTEI_KANRI_KOZA_OPENYMD: SUBIF005Recv.TKTEI_KANRI_KOZA_OPENYMD,                      //特定管理口座開設日
                KAKU_KYAKNM_KNJ: SUBIF005Recv.KAKU_KYAKNM_KNJ,                                        //加入者情報拡張情報（顧客名）
                KAKU_YUBINNO: SUBIF005Recv.KAKU_YUBINNO,                                              //加入者情報拡張情報（郵便番号）
                KAKU_ADDR: SUBIF005Recv.KAKU_ADDR,                                                    //加入者情報拡張情報（住所）
                NISA_KOZA_OPENYMD: SUBIF005Recv.NISA_KOZA_OPENYMD,                                    //NISA口座開設日

                KOZA: SUBIF005Recv.KOZA && [] ,                                                       //振込先口座

                SUKN_SITEI_K: SUBIF005Recv.SUKN_SITEI_K,                                              //利金・分配金支払方法銘柄包括指定区分
                SUKN_SYURUI_K: SUBIF005Recv.SUKN_SYURUI_K,                                            //利金・分配金支払方法種類
                SUKN_HKT_BK: SUBIF005Recv.SUKN_HKT_BK,                                                //利金・分配金支払方法包括登録銀行No
                GAIK_SYKN_YEN_SUKN_BK_HKT: SUBIF005Recv.GAIK_SYKN_YEN_SUKN_BK_HKT,                    //外証の円貨利金分配金振込銀行（包括）

                GAIK_SYKN_YEN_SUKN_BK_MEIG: SUBIF005Recv.GAIK_SYKN_YEN_SUKN_BK_MEIG && [] ,           //外証の円貨利金分配金振込銀行（銘柄）

                HIREIHAIBUN: SUBIF005Recv.HAITOUKIN,                                                  //振替株式の配当金等の証券口座受取申込（配当金受領方式）
                AMEIG_FURIKOMI: SUBIF005Recv.AMEIG_FURIKOMI,                                          //振替株式の配当金等の証券口座受取申込（全銘柄振込先指定方式）
                SOUHUSAKI_YBN_BNG: SUBIF005Recv.SOUHUSAKI_YBN_BNG,                                    //送付先新郵便番号
                SOUHUSAKI_JYSY_KNJ: SUBIF005Recv.SOUHUSAKI_JYSY_KNJ,                                  //送付先住所漢字
                SOUHUSAKI_JYSY_KN: SUBIF005Recv.SOUHUSAKI_JYSY_KN,                                    //送付先住所カナ
                // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
                CHOHYO_ETRN_CHK: SUBIF005Recv.CHOHYO_ETRN_CHK,                                        //ホスト帳票閲覧店権限管理チェック結果
                // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913

                BK_DAIRI_CHK: $scope.DAIRI,                                                           //銀行代理業チェック結果
            };


            //振込先口座
            //  登録No
            //  受取口座
            //  金融機関コード
            //  支店コード
            //  銀行名
            //  支店名
            //  預金種目
            //  口座番号
            //  記号
            //  通帳番号
            //  口座名義人カナ
            var length = SUBIF005Recv.KOZA ? SUBIF005Recv.KOZA.length : 0 ;
                for (var i= 0; i < length; i++) {
                    var dataKoza = 
                    {
                        KOZA_TRKNO: SUBIF005Recv.KOZA[i].KOZA_TRKNO,
                        KOZA_UKTRKZ: SUBIF005Recv.KOZA[i].KOZA_UKTRKZ,
                        KOZA_BK_C: SUBIF005Recv.KOZA[i].KOZA_BK_C_BK,
                        KOZA_MISE_C: SUBIF005Recv.KOZA[i].KOZA_MISE_C_BK,
                        KOZA_BK_NM: SUBIF005Recv.KOZA[i].KOZA_BK_NM_BK,
                        KOZA_BK_MISE_NM: SUBIF005Recv.KOZA[i].KOZA_MISE_NM_BK,
                        BK_YOKNKND: SUBIF005Recv.KOZA[i].KOZA_YOKNKND_BK,
                        BK_KOZA_CD: SUBIF005Recv.KOZA[i].KOZA_KOZA_CD_BK,
                        YUCH_BK_C: SUBIF005Recv.KOZA[i].YUCH_BK_C,
                        YUCH_BK_KOZA_CD: SUBIF005Recv.KOZA[i].YUCH_BK_KOZA_C,
                        BK_KOZA_KANA: SUBIF005Recv.KOZA[i].BK_KOZA_KANA,
                    };
                    modelObj.KOZA.push(dataKoza);
            }

            //外証の円貨利金分配金振込銀行（銘柄）
            //  銘柄コード
            //  外証の円貨利金分配金振込口座

            length = SUBIF005Recv.GAIK_SYKN_YEN_SUKN_BK_MEIG ? SUBIF005Recv.GAIK_SYKN_YEN_SUKN_BK_MEIG.length : 0 ;
                for (i= 0; i < length; i++) {
                    var dataGaik = 
                    {
                        GAIK_SYKN_YEN_SUKN_BK_MEIG_CD: SUBIF005Recv.GAIK_SYKN_YEN_SUKN_BK_MEIG[i].GAIK_SYKN_YEN_SUKN_BK_MEIG_MEIG_CD,
                        GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA: SUBIF005Recv.GAIK_SYKN_YEN_SUKN_BK_MEIG[i].GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA,
                    };
                    modelObj.GAIK_SYKN_YEN_SUKN_BK_MEIG.push(dataGaik);
                }
            AppBizCom.DataHolder.setCustomer(modelObj);
        } else {
            // お客さま情報を共通領域の顧客契約情報に設定（電子帳票）
            var modelObjEform = {
                MISE_C: SUBIF005Recv.MISE_C,                                                          //店部課コード
                KYAK_CIF_C: SUBIF005Recv.KYAK_CIF_C,                                                  //顧客コード
                KOZA_OPEN_YMD: SUBIF005Recv.KOZA_OPENYMD,                                             //口座開設日
                KAKARI_C: SUBIF005Recv.KAKARI_C,                                                      //係コード
                KYAKNM_SEI_KNJ: SUBIF005Recv.SIMEI_SEI,                                               //顧客姓（漢字）
                KYAKNM_MEI_KNJ: SUBIF005Recv.SIMEI_MEI,                                               //顧客名（漢字）
                KYAKNM_SEI_KANA: SUBIF005Recv.KANA_SEI,                                               //顧客姓（カナ）
                KYAKNM_MEI_KANA: SUBIF005Recv.KANA_MEI,                                               //顧客名（カナ）
                GNGO: SUBIF005Recv.GNGO_K,                                                            //元号
                SEINENYMD: SUBIF005Recv.SEINEN_YMD,                                                   //和暦年月日
                SEX_K: SUBIF005Recv.SEX_K,                                                            //性別区分
                JSYFMI: SUBIF005Recv.ADDR_UNKNOWN,                                                    //住所不明
                TIIKI_C: SUBIF005Recv.CHIKI_CD,                                                       //地域コード
                YUBINNO: SUBIF005Recv.YBN_BNG,                                                        //郵便番号
                KYAK_ADDR_KNJ: SUBIF005Recv.KYAK_JYSY_KNJ,                                            //顧客住所漢字
                KYAK_ADDR_KANA: SUBIF005Recv.KYAK_JYSY_KN,                                            //顧客住所カナ
                KYAK_HOSK_ADDR_KNJ: SUBIF005Recv.HSK_JYSY_KNJ,                                        //補足住所漢字
                KYAK_HOSK_ADDR_KANA: SUBIF005Recv.HSK_JYSY_KN,                                        //補足住所フリガナ
                KYAK_HOUSENM_KNJ: SUBIF005Recv.TTMN_NM_KNJ,                                           //建物名漢字
                KYAK_HOUSENM_KANA: SUBIF005Recv.TTMN_NM_KN,                                           //建物名フリガナ
            }
            AppBizCom.DataHolder.setCustomer(modelObjEform);
        }


        // コールバックログ出力
        logicCom.btnTapLog(GAMEN_THIS.ID, GAMEN_NEXT.ID, BTN_SEARCH);

        // 次ページに遷移
        logicCom.locationPath(GAMEN_NEXT.NAME, callbackFLG, callbackFLG, connectionErrorCallback);
        $scope.$applyAsync();

    };



    /**
     * G0060-01 イベント4：戻る（前画面遷移）
     * 「戻る」ボタンをタップすることで、前画面へ遷移する。
     */
    $scope.backBtnClick = function () {
        // ボタン連打防止フラグ
        if(stopBtnEventFLG) {
            return;
        } else {
            stopBtnEventFLG = true
        };

        var preRoutePath = AppBizDataHolder.getPrevRoutePath();
        logicCom.locationPath(preRoutePath, callbackFLG, callbackFLG, connectionErrorCallback);
        // アクションログ出力
        logicCom.btnTapLog(GAMEN_THIS.ID, GAMEN_PREV.ID, BTN_PREV);

    };


    /**
     * G0060-01 イベント3：既契約顧客情報検索　※「検索」ボタンタップ時
     * 「検索」ボタンをタップすることで、入力された口座番号の入力チェックを行い、REDOSサーバに既契約顧客情報検索要求を実施する
     * @param kouzaShiten {string} kouzaShiten - 検索条件口座支店
     * @param kouzaBango {string} kouzaBango - 検索条件口座番号
     */
    $scope.search = function (kouzaShiten: string, kouzaBango: string) {

        AppBizCom.Msg.clearAllErrors();

        // ボタン連打防止フラグ
        if(stopBtnEventFLG) {
            return;
        } else {
            stopBtnEventFLG = true
        };

        //口座番号の入力チェック
        //1) 必須チェックを行い、入力されていなければエラー
        //2) 属性チェックで数字チェックを行い、異なる属性が入力された場合はエラー

        for (var target in inputData) {
            inputData[target].val = $scope.MODEL[target];
        }
        var result = AppLgcMultiCheck.multiInputCheck(inputData, $scope.MODEL);
        msg = result[1];

        if (result[0]) {
            // アクションログ出力
            // 入力チェックエラーの場合、遷移元画面と遷移先画面は同じ
            logicCom.btnTapErrLog(GAMEN_THIS.ID, GAMEN_THIS.ID, BTN_SEARCH, msg);
            // ボタン連打防止フラグ
            stopBtnEventFLG = false;
        } else {
            // 入力チェックエラーが存在しない場合、後続処理を実施
            kouzaShiten = zeroPadding(kouzaShiten, 4);
            kouzaBango = zeroPadding(kouzaBango, 7);

            // ログイン者情報の取得
            var loginInfo = AppBizCom.DataHolder.getLoginInfo();

            //2) アプリ内メモリ（ログイン者データ）より社員ID,受付者店部課コード、受付者係コードを取得
            // 入力された口座番号と合わせてsubif005-SENDへ各項目を設定

            var subif005Send: any = {
                PROPER_C: loginInfo.PROPER_C,                   // 社員ID
                UKETSUKE_MISE_C: loginInfo.UKETSUKE_MISE_C,     // 受付者店部課コード
                UKETSUKE_KAKARI_C: loginInfo.UKETSUKE_KAKARI_C, // 受付者係コード
                MISE_C: kouzaShiten,                            // 店部課コード（入力値）
                KYAK_CIF_C: kouzaBango,                         // 顧客コード（入力値）
            }

            // インジケーター表示
            $('main').addClass('loadingCircle_blur');
            $('body').append('<div id="overlay"></div>');
            $('#overlay').append('<img class="loadingCircle" src="./images/loadingCircle.svg" draggable="false"></img>');

            logicCom.btnTapLog(GAMEN_THIS.ID, GAMEN_NEXT.ID, '検索', msg);

            //3) APPCOM-0005:REDOSサーバへの通信機能を呼び出し、subif005-SENDのPOST処理を行う
            AppCom.Http.post(appConst.SUBIF005.PATH, subif005Send,
                //POST処理成功
                successCallback,
                //POST処理失敗
                errorCallback);
        }
    }


    // 電話番号を'-'で3分割
    var splitTel = function (tel) {
        if (tel == ''){
            // 電話番号が空の場合のエラー回避のため'--'を設定
            tel = '--'
        }
        return tel.split( '-' );
    }

    // 4桁-7桁の前0埋め
    var zeroPadding = function (cd, length) {
        cd = '0000000' + cd;
        return cd.slice(-length);
    }

    init();

}]);

