/// <reference path="../reference.d.ts" />
App.controller('resultCustomerController', ['$scope', '$location', '$controller', 'AppBizCom', 'appConst', 'logicCom', 'appDefine', 'AppLgcApplyAssign', 'AppBizCodeMstData',
    function ($scope, $location, $controller, AppBizCom, appConst, logicCom, appDefine, AppLgcApplyAssign, AppBizCodeMstData) {
        /** 画面ID **/
        var GAMEN_THIS = { ID: 'G1060-02', NAME: 'resultCustomer' };
        var GAMEN_PREV = { ID: 'G1060-01', NAME: 'selectCustomer' };
        var GAMEN_NEXT = { ID: 'G1070-01', NAME: 'inputOperationStart' };
        /** コード区分 */
        var GNGO_K = 'GNGO_K'; //元号
        var SEX_K = 'SEX_K'; //性別
        var KKCH_K = 'KKCH_K'; //マイナンバー告知
        /** ボタン連打防止フラグ */
        var stopBtnEventFLG = false;
        var callbackFLG = function () { };
        // 通信エラー発生する場合、「閉じる」ボタン押下時に、「画面制御 二重制御」フラグを解除する
        var connectionErrorCallback = function () {
            stopBtnEventFLG = false;
        };
        // スクロール設定
        var scrollLock = function () { $('.scrollArea').css({ '-webkit-overflow-scrolling': 'auto' }); };
        var scrollUnlock = function () { $('.scrollArea').css({ '-webkit-overflow-scrolling': 'touch' }); };
        /**
         * 初期化処理
         */
        $scope.init = function () {
            //注意喚起表示用変数（表示文言、表示判定、表示カウント）
            $scope.msgNote = [];
            $scope.dispNote = [];
            $scope.cntNote = 0;
            // 既契約顧客情報の取得
            var Customer = AppBizCom.DataHolder.getCustomer();
            $scope.customerAttr = angular.copy(Customer);
            // 共通部分制御を継承
            $controller('errorInfoModalCtrl', { $scope: $scope });
            //電子帳票データが存在する場合は遷移先を'電子帳票対象書面選択画面'で上書き
            $scope.signDataObj = AppBizCom.DataHolder.getEFormInfo();
            if ($scope.signDataObj) {
                GAMEN_NEXT = { ID: 'G1400-01', NAME: 'selectSignDoc' };
                $scope.isSign = true;
            }
            //*****************************************************************************************
            // 編集処理
            // 元号をコード値を元にコードマスタ（元号区分）より取得して更新
            if ($scope.customerAttr.GNGO != '') {
                $scope.SEINEN_G = convertCodeToName(GNGO_K, $scope.customerAttr.GNGO);
                $scope.showSeinen = true;
                // 生年月日YYMMDDをYY,MM,DDに分割（画面表示用、他画面への受け渡し無し）
                $scope.SEINEN_Y = $scope.customerAttr.SEINENYMD.slice(0, 2);
                $scope.SEINEN_M = $scope.customerAttr.SEINENYMD.slice(2, 4);
                $scope.SEINEN_D = $scope.customerAttr.SEINENYMD.slice(4, 6);
            }
            // 性別をコード値を元にコードマスタ（性別区分）より取得して更新
            if ($scope.customerAttr.SEX_K != '') {
                $scope.SEX_N = convertCodeToName(SEX_K, $scope.customerAttr.SEX_K);
                $scope.showSex = true;
            }
            // 以下の項目は事務手続きの場合のみ編集
            if ($scope.isSign != true) {
                // 銀行代理業のお客様
                if ($scope.customerAttr.BK_DAIRI_CHK == 1) {
                    // 注意喚起：銀行代理業のお客様
                    $scope.msgNote[$scope.cntNote] = AppBizCom.Msg.getMsg('KKAP-SFJ04-06I', []);
                    $scope.dispNote[$scope.cntNote] = true;
                    $scope.cntNote++;
                }
                // マイナンバー告知をコード値を元にコードマスタ（マイナンバー告知区分）より取得して更新
                if ($scope.customerAttr.MYNO_KKC != '') {
                    $scope.KKCH_N = convertCodeToName(KKCH_K, $scope.customerAttr.MYNO_KKC);
                    $scope.showMyNo = true;
                }
                // 個人番号 （マイナンバー告知=0:未申告の場合、注意喚起を表示）
                if ($scope.customerAttr.MYNO_KKC == '0') {
                    // 注意喚起：マイナンバー告知あり
                    $scope.msgNote[$scope.cntNote] = AppBizCom.Msg.getMsg('KKAP-SFJ04-01I', []);
                    $scope.dispNote[$scope.cntNote] = true;
                    $scope.cntNote++;
                }
                // マル優・特別マル優契約あり
                if ($scope.customerAttr.MARUYU_K == '1') {
                    // 注意喚起：マル優・特別マル優契約あり
                    $scope.msgNote[$scope.cntNote] = AppBizCom.Msg.getMsg('KKAP-SFJ04-02I', []);
                    $scope.dispNote[$scope.cntNote] = true;
                    $scope.cntNote++;
                }
                // 住所変更必須
                if ($scope.customerAttr.JSYFMI == '1') {
                    // 注意喚起：住所変更要
                    $scope.msgNote[$scope.cntNote] = AppBizCom.Msg.getMsg('KKAP-SFJ04-03I', []);
                    $scope.dispNote[$scope.cntNote] = true;
                    $scope.cntNote++;
                }
                // 加入者情報拡張登録 （加入者情報拡張情報が存在する場合、加入者情報拡張情報を表示）
                if ($scope.customerAttr.KAKU_KYAKNM_KNJ != '') {
                    //加入者情報顧客名あり
                    $scope.expansionUser = true;
                }
                if ($scope.customerAttr.KAKU_YUBINNO != '') {
                    //加入者情報郵便番号あり
                    //表示用に3桁と4桁に分割し間に'－'を設定
                    $scope.YUBIN_NO = $scope.customerAttr.KAKU_YUBINNO.slice(0, 3) + '－' + $scope.customerAttr.KAKU_YUBINNO.slice(3, 7);
                    $scope.expansionCode = true;
                }
                if ($scope.customerAttr.KAKU_ADDR != '') {
                    //加入者情報住所あり
                    $scope.expansionAddr = true;
                }
                //加入者情報の顧客名・郵便番号・住所の何れかが存在する場合は注意喚起を表示
                if ($scope.expansionUser || $scope.expansionCode || $scope.expansionAddr) {
                    // 注意喚起：拡張登録あり
                    $scope.msgNote[$scope.cntNote] = AppBizCom.Msg.getMsg('KKAP-SFJ04-04I', []);
                    $scope.dispNote[$scope.cntNote] = true;
                    $scope.cntNote++;
                }
                // 特定口座開設日 (特定口座開設日がALL0または空以外の場合、YYYYMMDDをYYYY,MM,DDに分割（画面表示用、他画面への受け渡し無し））
                if ($scope.customerAttr.TKTEI_KOZA_OPENYMD != '00000000' && $scope.customerAttr.TKTEI_KOZA_OPENYMD != '') {
                    $scope.OPEN_YMD = $scope.customerAttr.TKTEI_KOZA_OPENYMD.slice(0, 4) + '年 ' + $scope.customerAttr.TKTEI_KOZA_OPENYMD.slice(4, 6) + '月 ' + $scope.customerAttr.TKTEI_KOZA_OPENYMD.slice(6, 8) + '日';
                    // 源泉徴収 （特定口座源徴区分=1:源泉徴収ありの場合、'源泉徴収あり'と注意喚起を表示）
                    if ($scope.customerAttr.TKTEI_KOZA_GNSN == '1') {
                        //源泉徴収あり
                        $scope.GNSN_N = '源泉徴収あり';
                        // 注意喚起：源泉徴収あり
                        $scope.msgNote[$scope.cntNote] = AppBizCom.Msg.getMsg('KKAP-SFJ04-05I', []);
                        $scope.dispNote[$scope.cntNote] = true;
                        $scope.cntNote++;
                    }
                    else {
                        //源泉徴収なし（注意喚起はなし）
                        $scope.GNSN_N = '源泉徴収なし';
                    }
                }
                else {
                    $scope.OPEN_YMD = '未開設';
                    $scope.GNSN_N = '';
                }
            }
        };
        // 共通領域保存処理(申込データ(事務手続き))
        var setNotificationInfo = function () {
            // 申込データの取得
            var notifInfo = AppBizCom.DataHolder.getNotifInfo();
            // 営業員情報の設定
            notifInfo.EIGYOIN_JOHO = notifInfo.EIGYOIN_JOHO ? notifInfo.EIGYOIN_JOHO : {};
            notifInfo.EIGYOIN_JOHO.PROPER_C = $scope.PROPER_C;
            notifInfo.EIGYOIN_JOHO.UKETSUKE_MISE_C = $scope.MISE_C;
            notifInfo.EIGYOIN_JOHO.UKETSUKE_KAKARI_C = $scope.KAKARI_C;
            // お客さま情報の設定
            notifInfo.KYAK_JOHO = notifInfo.KYAK_JOHO ? notifInfo.KYAK_JOHO : {};
            notifInfo.KYAK_JOHO.MISE_C = $scope.customerAttr.MISE_C;
            notifInfo.KYAK_JOHO.KYAK_CIF_C = $scope.customerAttr.KYAK_CIF_C;
            AppBizCom.DataHolder.setNotifInfo(notifInfo);
        };
        // 共通領域保存処理(申込データ(電子帳票))
        var setSignInfo = function () {
            // 申込データの取得
            var eFormInfo = AppBizCom.DataHolder.getEFormInfo();
            // 営業員情報の設定
            eFormInfo.EIGYOIN_JOHO = eFormInfo.EIGYOIN_JOHO ? eFormInfo.EIGYOIN_JOHO : {};
            eFormInfo.EIGYOIN_JOHO.PROPER_C = $scope.PROPER_C;
            eFormInfo.EIGYOIN_JOHO.UKETSUKE_MISE_C = $scope.MISE_C;
            eFormInfo.EIGYOIN_JOHO.UKETSUKE_KAKARI_C = $scope.KAKARI_C;
            // お客さま情報の設定
            eFormInfo.KYAK_JOHO = eFormInfo.KYAK_JOHO ? eFormInfo.KYAK_JOHO : {};
            eFormInfo.KYAK_JOHO.MISE_C = $scope.customerAttr.MISE_C;
            eFormInfo.KYAK_JOHO.KYAK_CIF_C = $scope.customerAttr.KYAK_CIF_C;
            AppBizCom.DataHolder.setEFormInfo(eFormInfo);
        };
        /**
         * G0060-02 イベント7：次へ（次画面へ遷移）
         * 「次へ」ボタンをタップすることで、次画面へ遷移する。
         */
        $scope.nextBtnClick = function () {
            scrollLock();
            // ボタン連打防止フラグ
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            ;
            // ログイン者情報の取得
            var loginInfo = AppBizCom.DataHolder.getLoginInfo();
            $scope.PROPER_C = loginInfo.PROPER_C; // 社員ID
            $scope.MISE_C = loginInfo.UKETSUKE_MISE_C; // 受付者店部課コード
            $scope.KAKARI_C = loginInfo.UKETSUKE_KAKARI_C; // 受付者係コード
            // 申込データの更新
            if ($scope.isSign) {
                // 申込データ(電子帳票)へのデータ更新
                setSignInfo();
            }
            else {
                // 申込データ(事務手続き)へのデータ更新
                setNotificationInfo();
            }
            logicCom.locationPath(GAMEN_NEXT.NAME, callbackFLG, callbackFLG, connectionErrorCallback);
            logicCom.btnTapLog(GAMEN_THIS.ID, GAMEN_NEXT.ID, '次へ', $scope.chk, true);
        };
        /**
          * G1060-02 イベント8：戻る（前画面へ遷移）
          * 「戻る」ボタンをタップすることで、前画面へ遷移する。
          */
        $scope.backBtnClick = function () {
            // ボタン連打防止フラグ
            if (stopBtnEventFLG) {
                return;
            }
            else {
                stopBtnEventFLG = true;
            }
            ;
            logicCom.locationPath(GAMEN_PREV.NAME, callbackFLG, callbackFLG, connectionErrorCallback);
            // アクションログ出力
            logicCom.btnTapLog(GAMEN_THIS.ID, GAMEN_PREV.ID, '戻る');
        };
        // コードマスタを取得してコード値を名称に変換
        var convertCodeToName = function (kbn, code) {
            var mst = AppBizCodeMstData.getCodeMstDataByKbn(kbn);
            var len = mst.length;
            for (var i = 0; i < len; i++) {
                if (code.match(mst[i].CD)) {
                    return mst[i].MSY;
                }
            }
        };
    }]);
