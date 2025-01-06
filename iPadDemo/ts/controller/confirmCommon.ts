/// <reference path="../reference.d.ts" />
// 「G1240-01」と「G1260-01」初期表示共通
App.controller('confirmCommon', ['$scope', 'AppComDate', 'AppBizDataHolder', 'AppBizCodeMstData',
    function ($scope, AppComDate, AppBizDataHolder, AppBizCodeMstData) {

        var strConst = {
            // ハイフンマイナス
            HYPHEN_MINUS: '－',
            // 全角スペース
            FULL_SPACE: '　',
            // 半角スペース
            HALF_SPACE: ' ',
            // 空文字
            EMPTY_CHAR: '',
            //「00000000」
            EIGHT_ZERO: '00000000',
            //「99999999」
            EIGHT_NINE: '99999999',
            // BASE64画像データのヘッダー
            BASE64_HEAD: 'data:image/jpeg;base64,'
        }

        // CD-001:申込データ（事務手続き）
        var notifInfo: any = {};
        // CD-001:申込データ（事務手続き）-> 事務手続き情報
        var jimuJoho: any = {};
        // CD-001:申込データ（事務手続き）-> 暗証番号情報
        var pinJoho: any = {};
        // CD-001:申込データ（事務手続き）-> 振込先口座
        var kozaAfter: any = {};
        // CD-001:申込データ（事務手続き）-> 番号確認書類情報
        var mnsyseiryJoho: any = {};
        // CD-001:申込データ（事務手続き）-> 本人確認書類情報
        var honinKakninSyJoho: any = {};
        // CD-003:画像データ
        var imageData: any = {};
        // CD-004:顧客契約情報
        var customer: any = {};
        // CD-004:顧客契約情報 -> 振込先口座
        var kozaBefore: any = {};
        // CD-004:顧客契約情報 -> 外証の円貨利金分配金振込銀行（銘柄）
        var gaikBankMeig: any = {};
        // CD-006:サービス時間情報（事務手続き）
        var serviceTimeJoho: any = {};
        // CD-006:サービス時間情報（事務手続き）-> 業務日付
        var gyomuDate: string = '';
        // CD-006:サービス時間情報（事務手続き）-> 業務日付（年）
        var gyomuYyyy: number = 0;
        // CD-008:画面遷移制御用フラグ
        var flowControlFlg: any = {};
        // CD-008:画面遷移制御用フラグ -> 入力画面遷移制御
        var inputFlgControl: any = {};
        // CD-010:申込データ（特定個人情報）
        var personInfo: any = {};

        /**
         * 文字列取得
         * @param {string | number} target 
         */
        var getString = function (target) {
            return (target || target === +target) ? target + strConst.EMPTY_CHAR : strConst.EMPTY_CHAR;
        }

        /**
         * コードマスター情報取得
         * @param {string} kbn 区分
         * @param {string} code コード
         * @param {string} prop プロパティ名
         */
        var getCodeInfo = function (kbn, code, prop = 'MSY') {
            if (!kbn || !code) {
                return strConst.EMPTY_CHAR;
            }
            var codeItem = AppBizCodeMstData.getCodeMstDataByCd(kbn, code);

            return codeItem ? getString(codeItem[prop]) : strConst.EMPTY_CHAR;
        }

        /**
         * 文字列続ける
         * @param {string} sep 区切り文字
         * @param {string | number} targets 文字列
         */
        var stringJoin = function (sep, ...targets) {
            if (!targets || sep == null) {
                return strConst.EMPTY_CHAR;
            }
            return targets.filter(function (t) { return t || t === +t }).join(sep);
        }

        /**
         * オブジェクト取得
         * @param {object} obj 
         */
        var getObject = function (obj) {
            return angular.isObject(obj) ? angular.copy(obj) : {};
        }

        /**
         * 年月日取得
         * @param {string} date 年月日
         */
        var dateParse = function (date) {
            date = getString(date);
            var rtDate = strConst.EMPTY_CHAR;
            switch (date.length) {
                case 6: rtDate = date.substring(0, 2) + '年' + strConst.HALF_SPACE + date.substring(2, 4) + '月' + strConst.HALF_SPACE + date.substring(4, 6) + '日'; break;
                case 8: rtDate = date.substring(0, 4) + '年' + strConst.HALF_SPACE + date.substring(4, 6) + '月' + strConst.HALF_SPACE + date.substring(6, 8) + '日'; break;
            }
            return rtDate;
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
            // CD-001:申込データ（事務手続き）-> 事務手続き情報 -> 振込先口座
            kozaAfter = getObject(jimuJoho.KOZA);
            // CD-001:申込データ（事務手続き）-> 本人確認書類情報
            honinKakninSyJoho = getObject(notifInfo.HONIN_KAKNIN_SY_JOHO);
            // CD-003:画像データ
            imageData = getObject(AppBizDataHolder.getImageData());
            // CD-004:顧客契約情報
            customer = getObject(AppBizDataHolder.getCustomer());
            // CD-004:顧客契約情報 -> 振込先口座
            kozaBefore = getObject(customer.KOZA);
            // CD-004:顧客契約情報 -> 外証の円貨利金分配金振込銀行（銘柄）
            gaikBankMeig = getObject(customer.GAIK_SYKN_YEN_SUKN_BK_MEIG);
            // CD-006:サービス時間情報（事務手続き）
            serviceTimeJoho = getObject(AppBizDataHolder.getServiceTime());
            // CD-006:サービス時間情報（事務手続き）-> 業務日付
            gyomuDate = serviceTimeJoho.GYOMU_DATE.substring(0, 4) + '-' + serviceTimeJoho.GYOMU_DATE.substring(4, 6) + '-' + serviceTimeJoho.GYOMU_DATE.substring(6, 8);
            // CD-006:サービス時間情報（事務手続き）-> 業務日付（年）
            gyomuYyyy = gyomuYyyy = new Date(gyomuDate).getFullYear();
            // CD-008:画面遷移制御用フラグ
            flowControlFlg = getObject(AppBizDataHolder.getFlowControlFlg());
            // CD-008:画面遷移制御用フラグ -> 入力画面遷移制御
            inputFlgControl = getObject(flowControlFlg.INPUT_FLG_CONTROL);
            // CD-010:申込データ（特定個人情報）
            personInfo = getObject(AppBizDataHolder.getPersonInfo());

        }

        // データ（変更前）
        var dataBeforeInit = function () {
            // おなまえ（漢字）
            var kyaknmKnj = stringJoin(strConst.FULL_SPACE, getString(customer.KYAKNM_SEI_KNJ), getString(customer.KYAKNM_MEI_KNJ));
            // おなまえ（カナ）
            var kyaknmKana = stringJoin(strConst.FULL_SPACE, getString(customer.KYAKNM_SEI_KANA), getString(customer.KYAKNM_MEI_KANA));
            // 郵便番号
            var baseYubinNo = getString(customer.YUBINNO);
            var yubinNo = (baseYubinNo && 7 === baseYubinNo.length) ? baseYubinNo.substring(0, 3) + strConst.HYPHEN_MINUS + baseYubinNo.substring(3) : strConst.EMPTY_CHAR;
            // ご住所①
            var kyakAddrKnj = getString(customer.KYAK_ADDR_KNJ);
            // ご住所①のフリガナ
            var kyakAddrKana = getString(customer.KYAK_ADDR_KANA);
            // ご住所②
            var kyakHoskAddrKnj = getString(customer.KYAK_HOSK_ADDR_KNJ);
            // ご住所②のフリガナ
            var kyakHoskAddrKana = getString(customer.KYAK_HOSK_ADDR_KANA);
            // ご住所③
            var kyakHousenmrKnj = getString(customer.KYAK_HOUSENM_KNJ);
            // ご住所③のフリガナ
            var kyakHousenmrKana = getString(customer.KYAK_HOUSENM_KANA);
            // 送付先郵便番号
            var baseSouhusakiYbkzng = getString(customer.SOUHUSAKI_YBN_BNG);
            var souhusakiYbkzng = (baseSouhusakiYbkzng && 7 === baseSouhusakiYbkzng.length) ? baseSouhusakiYbkzng.substring(0, 3) + strConst.HYPHEN_MINUS + baseSouhusakiYbkzng.substring(3) : strConst.EMPTY_CHAR;
            // 送付先住所
            var souhusakiJysyKnj = getString(customer.SOUHUSAKI_JYSY_KNJ);
            // 送付先フリガナ
            var souhusakiJysyKn = getString(customer.SOUHUSAKI_JYSY_KN);
            // ご自宅電話番号
            var telno = stringJoin(strConst.HYPHEN_MINUS, getString(customer.TELNO1), getString(customer.TELNO2), getString(customer.TELNO3));
            // 携帯電話番号
            var mobileTelno = stringJoin(strConst.HYPHEN_MINUS, getString(customer.MOBILE_TELNO1), getString(customer.MOBILE_TELNO2), getString(customer.MOBILE_TELNO3));
            // FAX番号
            var faxno = stringJoin(strConst.HYPHEN_MINUS, getString(customer.FAXNO1), getString(customer.FAXNO2), getString(customer.FAXNO3));
            // 日興MRF累積投資口座申込
            var nikkoMrf = getCodeInfo('KIYK_K', customer.NIKKO_MRF);
            // カード発行日
            var nikkoCard = strConst.EIGHT_ZERO === getString(customer.NIKKO_CARD) ? '未発行' : dateParse(customer.NIKKO_CARD);
            // 申込日（日興イージートレード）
            var nikkoEz = strConst.EIGHT_ZERO === getString(customer.NIKKO_EZ) ? '未申込' : dateParse(customer.NIKKO_EZ);
            // 電子交付サービス
            var dnsKofuSrv = getCodeInfo('KIYK_K', customer.DNS_KOFU_SRV);
            // 開設日（外国証券取引口座）
            var gaikSyknKozaOpenymd = strConst.EIGHT_ZERO === getString(customer.GAIK_SYKN_KOZA_OPENYMD) ? '未開設' : dateParse(customer.GAIK_SYKN_KOZA_OPENYMD);
            // 開設日（特定口座）
            var tkteiKozaOpenymd = strConst.EIGHT_ZERO === getString(customer.TKTEI_KOZA_OPENYMD) ? '未開設' : dateParse(customer.TKTEI_KOZA_OPENYMD);
            // 勘定区分
            var tkteiKozaAc = getCodeInfo('ACKBN', customer.TKTEI_KOZA_AC);
            // 源泉徴収区分
            var tkteiKozaGnsn = getCodeInfo('GNSEN_TYOSYU_K', customer.TKTEI_KOZA_GNSN);

            // 源泉徴収予約日・予約情報
            var tkteiKozaYyk = strConst.EMPTY_CHAR;
            var tkteiKozaYyyy = customer.TKTEI_KOZA_YYKYMD.slice(0, 4); // 特定口座源徴予約日（年）
            var tkteiKozaYykymd = customer.TKTEI_KOZA_YYKYMD.replace(/(\d{4})(\d{2})(\d{2})/, '$1年 $2月 $3日');  // 特定口座源徴予約日（出力仕様）
            if (gyomuYyyy == tkteiKozaYyyy) {
                // ③「源泉徴収予約日」が当年の場合は、
                var tmpTkteiKozaYyk = getCodeInfo('GNSEN_TYOSYU_K', customer.TKTEI_KOZA_YYK);
                // 【予約情報】に「源泉徴収予約日」を表示する
                // 「源泉徴収予約区分」が1ならば【予約情報】に「源泉徴収あり」を追加出力する
                // 「源泉徴収予約区分」が1以外ならば【予約情報】に「源泉徴収なし」を追加出力する
                tkteiKozaYyk = tkteiKozaYykymd + strConst.FULL_SPACE + tmpTkteiKozaYyk;
                // 「源泉徴収予約日」が当年でなければ【予約情報】は空を設定する
            }

            // 年初取引
            var tkteiKozaNensyTorihikiymd = strConst.EMPTY_CHAR;
            // if (strConst.EIGHT_ZERO === getString(customer.TKTEI_KOZA_OPENYMD) || strConst.EMPTY_CHAR === getString(customer.TKTEI_KOZA_NENSY_TORIHIKIYMD)) {
            //     tkteiKozaNensyTorihikiymd = '';
            // } else if (strConst.EIGHT_ZERO === getString(customer.TKTEI_KOZA_NENSY_TORIHIKIYMD)) {
            //     tkteiKozaNensyTorihikiymd = 'なし';
            // } else if (getString(customer.TKTEI_KOZA_NENSY_TORIHIKIYMD).substring(0, 4) === new Date(gyomuDate).getFullYear().toString()) {
            //     tkteiKozaNensyTorihikiymd = 'あり';
            // } else {
            //     tkteiKozaNensyTorihikiymd = '確認要';
            // }
            var tmpTorihikiYmd = customer.TKTEI_KOZA_NENSY_TORIHIKIYMD;
            // 特定口座開設済みの場合
            if (strConst.EIGHT_ZERO != getString(customer.TKTEI_KOZA_OPENYMD)) {
                // 特定口座年初取引の（年）当年の場合、「あり」と表示する。
                if (angular.isString(tmpTorihikiYmd) && getString(tmpTorihikiYmd).substring(0, 4) == new Date(gyomuDate).getFullYear().toString()) {
                    tkteiKozaNensyTorihikiymd = 'あり';
                } 
                // 特定口座年初取引は「''」（空）ではない場合、「確認要」と表示する。
                else if (tmpTorihikiYmd != '') {
                    tkteiKozaNensyTorihikiymd = '確認要';
                }
                // 上記以外の場合、「''」と表示する。
                else {
                    tkteiKozaNensyTorihikiymd = '';
                }
            }

            // 開設日（特定管理口座）
            var tkteiKanriKozaOpenymd = strConst.EIGHT_ZERO === getString(customer.TKTEI_KANRI_KOZA_OPENYMD) ? '未開設' : dateParse(customer.TKTEI_KANRI_KOZA_OPENYMD);
            // 拡張情報（顧客名）
            var kakuKyaknmKnj = getString(customer.KAKU_KYAKNM_KNJ);
            // 拡張情報（郵便番号）
            var kakuYubinno = getString(customer.KAKU_YUBINNO) ? getString(customer.KAKU_YUBINNO).substring(0, 3) + getString(customer.KAKU_YUBINNO).substring(3) : strConst.EMPTY_CHAR;
            // 拡張情報（住所）
            var kakuAddr = getString(customer.KAKU_ADDR);
            // 開設年（NISA口座開設）
            var nisaKozaOpenymd = strConst.EMPTY_CHAR;
            // 「00000000」または文字列ではない場合、「未開設」と表示する
            if (strConst.EIGHT_ZERO === getString(customer.NISA_KOZA_OPENYMD)) {
                nisaKozaOpenymd = '未開設';
            } 
            // 「99999999」の場合、「未開設（申込中）」と表示する
            else if (strConst.EIGHT_NINE === getString(customer.NISA_KOZA_OPENYMD)) {
                nisaKozaOpenymd = '未開設（申込中）';
            }
            // 上記以外の場合（yyyymmdd）、 「xxxx年」と表示する
            else if (getString(customer.NISA_KOZA_OPENYMD).length === 8 ) {
                nisaKozaOpenymd = dateParse(customer.NISA_KOZA_OPENYMD).substring(0, 5);
            }
            // 告知状態
            var mynoKkc = getCodeInfo('KKCH_K', customer.MYNO_KKC);

            // 振込先口座[X]
            var furikomiKoza = [];
            for (var i = 0; i < kozaBefore.length; i++) {
                // 画面データ
                var kz: any = {};
                // 画面遷移制御用フラグ.入力画面遷移制御.振込先口座削除フラグ[X]
                kz.KOZA_DEL_F = getString(inputFlgControl.KOZA_DEL_F[i]);
                // 登録銀行No[X]
                kz.KOZA_TRKNO = getString(kozaBefore[i].KOZA_TRKNO);
                // 金融機関コード[X]
                kz.KOZA_BK_CODE = stringJoin(strConst.HYPHEN_MINUS, getString(kozaBefore[i].KOZA_BK_C), getString(kozaBefore[i].KOZA_MISE_C).slice(-3));
                // 銀行名[X]
                kz.KOZA_BK_NM = getString(kozaBefore[i].KOZA_BK_NM);
                // 支店名[X]
                kz.KOZA_BK_MISE_NM = getString(kozaBefore[i].KOZA_BK_MISE_NM);
                // 口座番号[X]
                kz.KOZA_BANGO = stringJoin(strConst.HALF_SPACE, getCodeInfo('BK_YOKNKND', kozaBefore[i].BK_YOKNKND), getString(kozaBefore[i].BK_KOZA_CD));
                // 記号[X]
                kz.YUCH_BK_C = getString(kozaBefore[i].YUCH_BK_C);
                // 通帳番号[X]
                kz.YUCH_BK_KOZA_CD = getString(kozaBefore[i].YUCH_BK_KOZA_CD);
                // 口座名義人カナ[X]
                kz.BK_KOZA_KANA = getString(kozaBefore[i].BK_KOZA_KANA);
                // 受取口座[X]
                kz.KOZA_UKTRKZ = getString(kozaBefore[i].KOZA_UKTRKZ);

                furikomiKoza.push(kz);
            }

            // 包括（利金・分配金）
            var sukn = strConst.EMPTY_CHAR;
            // 顧客契約情報.利金・分配金支払方法銘柄包括指定区分は「0：包括」、または「3：包括＆銘柄」の場合
            if ('0' === getString(customer.SUKN_SITEI_K) || '3' === getString(customer.SUKN_SITEI_K)) {
                //「11:公社債投信の買付入金」の場合
                if ('11' === getString(customer.SUKN_SYURUI_K)) {
                    sukn = 'ハイパック：公社債投信コース';
                    //「20:銀行振込出金」、または「30:郵貯」の場合
                } else if ('20' === getString(customer.SUKN_SYURUI_K) || '30' === getString(customer.SUKN_SYURUI_K)) {
                    sukn = '登録銀行No' + strConst.HALF_SPACE + getString(customer.SUKN_HKT_BK);
                    //「50:預り金入金」の場合
                } else if ('50' === getString(customer.SUKN_SYURUI_K)) {
                    sukn = '預り金へ入金';
                    // 上記以外の場合
                } else {
                    sukn = 'その他';
                }
                //「0：包括」、または「3：包括＆銘柄」以外の場合
            } else {
                sukn = 'なし';
            }

            // 銘柄（利金・分配金）
            // 顧客契約情報の利金・分配金支払方法銘柄包括指定区分（SUKN_SITEI_K）が"1：個別"、または"3：包括＆銘柄"の場合、「あり」を出力する、それ以外のばあい「なし」を出力する
            var suknSiteiK = ('1' === getString(customer.SUKN_SITEI_K) || '3' === getString(customer.SUKN_SITEI_K)) ? 'あり' : 'なし';
            // 包括（外証）
            var gaikSyknYenSuknBkHkt = strConst.EMPTY_CHAR === getString(customer.GAIK_SYKN_YEN_SUKN_BK_HKT) ? 'なし' : '登録銀行No' + strConst.HALF_SPACE + getString(customer.GAIK_SYKN_YEN_SUKN_BK_HKT);

            // 銘柄／受取口座（外証）[X]
            var meigKoza = [];
            for (var i = 0; i < gaikBankMeig.length; i++) {
                // 画面データ
                var mk: any = {};
                // 銘柄／受取口座（外証）[X]
                mk.GAIK_SYKN_YEN_SUKN_BK_MEIG = getString(gaikBankMeig[i].GAIK_SYKN_YEN_SUKN_BK_MEIG_CD) + '／登録銀行No' + strConst.HALF_SPACE + getString(gaikBankMeig[i].GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA);
                meigKoza.push(mk);
            }

            // 受取方法
            var uketorihoho = strConst.EMPTY_CHAR;
            // ｢0:指定なし｣の場合、”指定なし”と表示する。
            if ('0' === getString(customer.HIREIHAIBUN)) {
                uketorihoho = '指定なし';
            }
            else if ('1' === getString(customer.HIREIHAIBUN)) {
                uketorihoho = '全銘柄振込先指定方式　登録銀行No' + strConst.HALF_SPACE + getString(customer.AMEIG_FURIKOMI);
            }
            else if ('2' === getString(customer.HIREIHAIBUN)) {
                uketorihoho = '株式数比例配分方式';
            }

            $scope.dataBefore = {
                KYAKNM_KNJ: kyaknmKnj, // おなまえ（漢字）
                KYAKNM_KANA: kyaknmKana, // おなまえ（カナ）
                YUBINNO: yubinNo, // 郵便番号
                KYAK_ADDR_KNJ: kyakAddrKnj, // ご住所①
                KYAK_ADDR_KANA: kyakAddrKana, // ご住所②のフリガナ
                KYAK_HOSK_ADDR_KNJ: kyakHoskAddrKnj, // ご住所②
                KYAK_HOSK_ADDR_KANA: kyakHoskAddrKana, // ご住所②のフリガナ
                KYAK_HOUSENM_KNJ: kyakHousenmrKnj, // ご住所③
                KYAK_HOUSENM_KANA: kyakHousenmrKana, // ご住所③のフリガナ
                SOUHUSAKI_YBN_BNG: souhusakiYbkzng, // 送付先郵便番号
                SOUHUSAKI_JYSY_KNJ: souhusakiJysyKnj, // 送付先住所
                SOUHUSAKI_JYSY_KN: souhusakiJysyKn, // 送付先フリガナ
                TELNO: telno, // ご自宅電話番号
                MOBILE_TELNO: mobileTelno, // 携帯電話番号
                FAXNO: faxno, // FAX番号
                NIKKO_MRF: nikkoMrf, // 日興MRF累積投資口座申込
                NIKKO_CARD: nikkoCard, // カード発行日
                NIKKO_EZ: nikkoEz, // 申込日（日興イージートレード）
                DNS_KOFU_SRV: dnsKofuSrv, // 電子交付サービス
                GAIK_SYKN_KOZA_OPENYMD: gaikSyknKozaOpenymd, // 開設日（外国証券取引口座）
                TKTEI_KOZA_OPENYMD: tkteiKozaOpenymd, // 開設日（特定口座）
                TKTEI_KOZA_AC: tkteiKozaAc, // 勘定区分
                TKTEI_KOZA_GNSN: tkteiKozaGnsn, // 源泉徴収区分
                TKTEI_KOZA_YYK: tkteiKozaYyk, // 予約情報
                TKTEI_KOZA_NENSY_TORIHIKIYMD: tkteiKozaNensyTorihikiymd, // 年初取引
                TKTEI_KANRI_KOZA_OPENYMD: tkteiKanriKozaOpenymd, // 開設日（特定管理口座）
                KAKU_KYAKNM_KNJ: kakuKyaknmKnj, // 拡張情報（顧客名）
                KAKU_YUBINNO: kakuYubinno, // 拡張情報（郵便番号）
                KAKU_ADDR: kakuAddr, // 拡張情報（住所）
                NISA_KOZA_OPENYMD: nisaKozaOpenymd, // 開設年（NISA口座開設）
                MYNO_KKC: mynoKkc, // 告知状態
                FURIKOMI_KOZA: furikomiKoza, // 振込先口座[X]
                SUKN: sukn, // 包括（利金・分配金）
                SUKN_SITEI_K: suknSiteiK, // 銘柄（利金・分配金）
                GAIK_SYKN_YEN_SUKN_BK_HKT: gaikSyknYenSuknBkHkt, // 包括（外証）
                MEIG_KOZA: meigKoza, // 銘柄／受取口座（外証）
                UKETORI_HOHO: uketorihoho, // 受取方法

            }
        }

        // データ（変更後）
        var dataAfterInit = function () {
            // おなまえ（漢字）
            var kyaknmKnj = stringJoin(strConst.FULL_SPACE, getString(jimuJoho.KYAKNM_SEI_KNJ), getString(jimuJoho.KYAKNM_MEI_KNJ));
            // おなまえ（カナ）
            var kyaknmKana = stringJoin(strConst.FULL_SPACE, getString(jimuJoho.KYAKNM_SEI_KANA), getString(jimuJoho.KYAKNM_MEI_KANA));
            // 郵便番号
            var baseYubinNo = getString(jimuJoho.YUBINNO);
            var yubinNo = (baseYubinNo && 7 === baseYubinNo.length) ? baseYubinNo.substring(0, 3) + strConst.HYPHEN_MINUS + baseYubinNo.substring(3) : strConst.EMPTY_CHAR;

            // ご住所①
            // var kyakAddrKnj = strConst.EMPTY_CHAR;
            // // 申込データ(事務手続き).事務手続き情報.住所入力フラグが「0：郵便番号から住所を入力する」の場合
            // if ('0' === getString(jimuJoho.KYAK_ADDR_FLAG)) {
            var kyakAddrKnj = getString(jimuJoho.KYAK_ADDR_KNJ);
            //     // 申込データ(事務手続き).事務手続き情報.住所入力フラグが「1：住所を直接入力する」の場合
            // } else if ('1' === getString(jimuJoho.KYAK_ADDR_FLAG)) {
            //     kyakAddrKnj = getCodeInfo('TDFKN_C', jimuJoho.KYAK_ADDR_TDHKN) + strConst.FULL_SPACE + getString(jimuJoho.KYAK_ADDR_KNJ);
            // }

            // ご住所①のフリガナ
            var kyakAddrKana = getString(jimuJoho.KYAK_ADDR_KANA);
            // if ('1' === getString(jimuJoho.KYAK_ADDR_FLAG)) {
            //     kyakAddrKana = getCodeInfo('TDFKN_C', jimuJoho.KYAK_ADDR_TDHKN, 'STM1') + strConst.FULL_SPACE + getString(jimuJoho.KYAK_ADDR_KANA);
            // }

            // ご住所②
            var kyakHoskAddrKnj = getString(jimuJoho.KYAK_HOSK_ADDR_KNJ);
            // ご住所②のフリガナ
            var kyakHoskAddrKana = getString(jimuJoho.KYAK_HOSK_ADDR_KANA);
            // ご住所③
            var kyakHousenmrKnj = getString(jimuJoho.KYAK_HOUSENM_KNJ);
            // ご住所③のフリガナ
            var kyakHousenmrKana = getString(jimuJoho.KYAK_HOUSENM_KANA);
            // 転居日
            var tnkyDay = stringJoin(strConst.HALF_SPACE, getCodeInfo('GNGO_K', jimuJoho.TNKY_GNGO), dateParse(jimuJoho.TNKYYMD));
            // 年初住所
            var nensyJsy = getCodeInfo('TDFKN_C', jimuJoho.NENSY_JSY);

            // ご自宅電話番号
            var telno = strConst.EMPTY_CHAR;
            if ('0' === getString(jimuJoho.TELNO_DEL)) {
                telno = stringJoin(strConst.HYPHEN_MINUS, getString(jimuJoho.TELNO1), getString(jimuJoho.TELNO2), getString(jimuJoho.TELNO3));
            } else if ('1' === getString(jimuJoho.TELNO_DEL)) {
                telno = getCodeInfo('DEL_FLG', jimuJoho.TELNO_DEL);
            }
            // 携帯電話番号
            var mobileTelno = strConst.EMPTY_CHAR;
            if ('0' === getString(jimuJoho.MOBILE_TELNO_DEL)) {
                mobileTelno = stringJoin(strConst.HYPHEN_MINUS, getString(jimuJoho.MOBILE_TELNO1), getString(jimuJoho.MOBILE_TELNO2), getString(jimuJoho.MOBILE_TELNO3));

            } else if ('1' === getString(jimuJoho.MOBILE_TELNO_DEL)) {
                mobileTelno = getCodeInfo('DEL_FLG', jimuJoho.MOBILE_TELNO_DEL);
            }
            // FAX番号
            var faxno = strConst.EMPTY_CHAR;
            if ('0' === getString(jimuJoho.FAXNO_DEL)) {
                faxno = stringJoin(strConst.HYPHEN_MINUS, getString(jimuJoho.FAXNO1), getString(jimuJoho.FAXNO2), getString(jimuJoho.FAXNO3));
            } else if ('1' === getString(jimuJoho.FAXNO_DEL)) {
                faxno = getCodeInfo('DEL_FLG', jimuJoho.FAXNO_DEL);
            }

            // 日興MRF累積投資口座申込
            var nikkoMrf = getString(jimuJoho.NIKKO_MRF);
            // 申込区分（日興カード）
            var nikkoCard = getCodeInfo('SNK_KJY_SAIHK_K', jimuJoho.NIKKO_CARD);
            // 日興カード暗証番号
            var nikkoCardPin = getString(pinJoho.NIKKO_CARD_PIN);
            // 申込区分（日興イージートレード）
            var nikkoEz = getString(jimuJoho.NIKKO_EZ);
            // 外国証券取引口座申込
            var gaikSyknKoza = getString(jimuJoho.GAIK_SYKN_KOZA);
            // 申込区分
            var tkteiKozaMskm = getCodeInfo('KST_HNK_HAIS_K', jimuJoho.TKTEI_KOZA_MSKM);
            // 勘定区分
            var tkteiKozaAc = strConst.EMPTY_CHAR;
            // 特定口座源泉徴収選択・配当等受入
            var tkteiKozaGnsn = strConst.EMPTY_CHAR;
            // 源泉徴収変更予約
            var tkteiKozaYyk = strConst.EMPTY_CHAR;

            // 年初住所
            var tkteiKozaNensyJsy = strConst.EMPTY_CHAR;
            // 申込データ(事務手続き).事務手続き情報.特定口座申込区分が「１.開設」、「2.変更」の場合下記の通りに編集する。
            if ('1' === getString(jimuJoho.TKTEI_KOZA_MSKM) || '2' === getString(jimuJoho.TKTEI_KOZA_MSKM)) {
                tkteiKozaAc = getCodeInfo('ACKBN', jimuJoho.TKTEI_KOZA_AC);
                tkteiKozaGnsn = getCodeInfo('GNSEN_TYOSYU_K', jimuJoho.TKTEI_KOZA_GNSN);
                tkteiKozaYyk = getCodeInfo('GNSEN_TYOSYU_K', jimuJoho.TKTEI_KOZA_YYK);
                tkteiKozaNensyJsy = getCodeInfo('TDFKN_C', jimuJoho.TKTEI_KOZA_NENSY_JSY);
            }

            // 開設（特定管理口座）
            var tkteiKanriKozaMskm = getCodeInfo('MOSKM_K', jimuJoho.TKTEI_KANRI_KOZA_MSKM);
            // 拡張情報
            var kanyusyExpTopkK = ('1' === getString(jimuJoho.KANYUSY_EXP_TORK_K)) ? '抹消' : '';
            // NISA口座開設
            var nisaKozaMskm = getCodeInfo('NISA_F', jimuJoho.NISA_KOZA_MSKM);
            // 株式数比例配分方式
            var hireihaibun = getString(jimuJoho.HIREIHAIBUN);
            // 個人番号の登録
            var mynoKokuchi = getCodeInfo('KKCHSR_K', jimuJoho.MYNO_KOKUCHI);

            // 振込先口座[X]
            var furikomiKoza = [];
            for (var i = 0; i < kozaBefore.length; i++) {
                // 画面データ
                var kz: any = {};
                // 画面遷移制御用フラグ.入力画面遷移制御.振込先口座削除フラグ[X]
                kz.KOZA_DEL_F = getString(inputFlgControl.KOZA_DEL_F[i]);
                // 登録情報[X]
                kz.KOZA_TORK_K = kz.KOZA_DEL_F == '1' ? getCodeInfo('TKSKJ_K', '0') : getCodeInfo('TKSKJ_K', '1');
                // 登録銀行No[X]
                kz.KOZA_TRKNO = getString(kozaBefore[i].KOZA_TRKNO);
                // 金融機関コード[X]
                kz.KOZA_BK_CODE = stringJoin(strConst.HYPHEN_MINUS, getString(kozaBefore[i].KOZA_BK_C), getString(kozaBefore[i].KOZA_MISE_C).slice(-3));
                // 銀行名[X]
                kz.KOZA_BK_NM = getString(kozaBefore[i].KOZA_BK_NM);
                // 支店名[X]
                kz.KOZA_BK_MISE_NM = getString(kozaBefore[i].KOZA_BK_MISE_NM);
                // 口座番号[X]
                kz.KOZA_BANGO = stringJoin(strConst.HALF_SPACE, getCodeInfo('BK_YOKNKND', kozaBefore[i].BK_YOKNKND), getString(kozaBefore[i].BK_KOZA_CD));
                // 記号[X]
                kz.YUCH_BK_C = getString(kozaBefore[i].YUCH_BK_C);
                // 通帳番号[X]
                kz.YUCH_BK_KOZA_CD = getString(kozaBefore[i].YUCH_BK_KOZA_CD);
                // 口座名義人カナ[X]
                kz.BK_KOZA_KANA = getString(kozaBefore[i].BK_KOZA_KANA);
                // 受取口座[X]
                kz.KOZA_UKTRKZ = getString(kozaBefore[i].KOZA_UKTRKZ);

                if (kz.KOZA_DEL_F) {
                    furikomiKoza.push(kz);
                }
            }
            for (var i = 0; i < kozaAfter.length; i++) {
                // 画面データ
                var kz: any = {};
                // 登録情報[X]
                kz.KOZA_TORK_K = getCodeInfo('TKSKJ_K', kozaAfter[i].KOZA_TORK_K);
                // 登録銀行No[X]
                kz.KOZA_TRKNO = getString(kozaAfter[i].KOZA_TORK_NO);
                // 金融機関コード[X]
                kz.KOZA_BK_CODE = stringJoin(strConst.HYPHEN_MINUS, getString(kozaAfter[i].KOZA_BK_C_ADD_BK), getString(kozaAfter[i].KOZA_MISE_C_ADD_BK));
                // 銀行名[X]
                kz.KOZA_BK_NM = getString(kozaAfter[i].KOZA_BK_NM);
                // 支店名[X]
                kz.KOZA_BK_MISE_NM = getString(kozaAfter[i].KOZA_BK_MISE_NM);
                // 口座番号[X]
                kz.KOZA_BANGO = stringJoin(strConst.HALF_SPACE, getCodeInfo('BK_YOKNKND', kozaAfter[i].KOZA_YOKNKND_ADD_BK), getString(kozaAfter[i].KOZA_KOZA_CD_ADD_BK));
                // 記号[X]
                kz.YUCH_BK_C = getString(kozaAfter[i].KOZA_BK_C_ADD_YUCH);
                // 通帳番号[X]
                kz.YUCH_BK_KOZA_CD = getString(kozaAfter[i].YUCH_BK_KOZA_CD_ADD_YUCH);
                // 受取口座[X]
                kz.KOZA_UKTRKZ = '2' === getString(kozaAfter[i].KOZA_UKTRKZ) ? '0' : '1';

                if (('1' === getString(inputFlgControl.BK_KOZA_ADD_F) && '1' === kz.KOZA_UKTRKZ) || ('1' === getString(inputFlgControl.YUCH_KOZA_ADD_F) && '0' === kz.KOZA_UKTRKZ)) {
                    furikomiKoza.push(kz);
                }
            }

            // 支払方法（利金・分配金）
            var sukn = strConst.EMPTY_CHAR;
            // 申込データ(事務手続き).事務手続き情報. 利金・分配金支払方法（包括）預り金入金は「0：登録銀行に振り込み」の場合
            if ('0' === getString(jimuJoho.SUKN_HKT_AZKR)) {
                sukn = '登録銀行No' + strConst.HALF_SPACE + getString(jimuJoho.SUKN_HKT_TRKNO) + 'に変更';
                //「1：預り金へ入金」の場合
            } else if ('1' === getString(jimuJoho.SUKN_HKT_AZKR)) {
                sukn = '預り金へ入金';
            }

            // 包括へ変更
            var suknHktMeigK = getString(jimuJoho.SUKN_HKT_MEIG_K);

            // 支払方法（外証）
            var suknYen = strConst.EMPTY_CHAR;
            // 申込データ(事務手続き).事務手続き情報. 外証の円貨利金分配金預り金入金は「0：登録銀行に振り込み」の場合
            if ('0' === getString(jimuJoho.GAIK_SYKN_YEN_SUKN_AZKR)) {
                suknYen = '登録銀行No' + strConst.HALF_SPACE + getString(jimuJoho.GAIK_SYKN_YEN_SUKN_BK) + 'に変更';
                //「1：預り金へ入金」の場合
            } else if ('1' === getString(jimuJoho.GAIK_SYKN_YEN_SUKN_AZKR)) {
                suknYen = '預り金へ入金';
            }

            // 支払方法（累投）
            var ruitouSukn = strConst.EMPTY_CHAR;
            // 申込データ(事務手続き).事務手続き情報. 累投（株投型）分配金買付停止区分は「3：入金先変更」の場合
            if ('3' === getString(jimuJoho.RUITOU_SUKN_KAIT_TEIS_K)) {
                ruitouSukn = '登録銀行No' + strConst.HALF_SPACE + getString(jimuJoho.RUITOU_SUKN_TRKNO) + 'に変更';
                //「3：入金先変更」以外の場合
            } else {
                ruitouSukn = getCodeInfo('RTBPKKTT_K', jimuJoho.RUITOU_SUKN_KAIT_TEIS_K);
            }

            // 申込区分（配当金受領方式）
            var haitknSyknUktrMskm = getCodeInfo('MSK_HNK_K', jimuJoho.HAITKN_SYKN_UKTR_MSKM);

            // 受取方法（配当金受領方式）
            var ameigFurikomi = strConst.EMPTY_CHAR;
            // 申込データ(事務手続き).事務手続き情報.配当金受領方式申込区分が「 3：抹消」ではない場合
            if ('' !== getString(jimuJoho.HAITKN_SYKN_UKTR_MSKM) && '3' !== getString(jimuJoho.HAITKN_SYKN_UKTR_MSKM)) {
                ameigFurikomi = '全銘柄振込先指定方式　登録銀行No' + strConst.HALF_SPACE + getString(jimuJoho.AMEIG_FURIKOMI) + 'を登録';
            }

            $scope.dataAfter = {
                KYAKNM_KNJ: kyaknmKnj, // おなまえ（漢字）
                KYAKNM_KANA: kyaknmKana, // おなまえ（カナ）
                YUBINNO: yubinNo, // 郵便番号
                KYAK_ADDR_KNJ: kyakAddrKnj, // ご住所①
                KYAK_ADDR_KANA: kyakAddrKana, // ご住所②のフリガナ
                KYAK_HOSK_ADDR_KNJ: kyakHoskAddrKnj, // ご住所②
                KYAK_HOSK_ADDR_KANA: kyakHoskAddrKana, // ご住所②のフリガナ
                KYAK_HOUSENM_KNJ: kyakHousenmrKnj, // ご住所③
                KYAK_HOUSENM_KANA: kyakHousenmrKana, // ご住所③のフリガナ
                TNKDAY: tnkyDay, // 転居日
                NENSY_JSY: nensyJsy, // 年初住所
                TELNO: telno, // ご自宅電話番号
                MOBILE_TELNO: mobileTelno, // 携帯電話番号
                FAXNO: faxno, // FAX番号
                NIKKO_MRF: nikkoMrf, // 日興MRF累積投資口座申込
                NIKKO_CARD: nikkoCard, // 申込区分（日興カード）
                NIKKO_CARD_PIN: nikkoCardPin, // 日興カード暗証番号
                NIKKO_EZ: nikkoEz, // 申込区分（日興イージートレード）
                GAIK_SYKN_KOZA: gaikSyknKoza, // 外国証券取引口座申込
                TKTEI_KOZA_MSKM: tkteiKozaMskm, // 申込区分
                TKTEI_KOZA_AC: tkteiKozaAc, // 勘定区分
                TKTEI_KOZA_GNSN: tkteiKozaGnsn, // 特定口座源泉徴収選択・配当等受入
                TKTEI_KOZA_YYK: tkteiKozaYyk, // 源泉徴収変更予約
                TKTEI_KOZA_NENSY_JSY: tkteiKozaNensyJsy, // 年初住所
                TKTEI_KANRI_KOZA_MSKM: tkteiKanriKozaMskm, // 開設（特定管理口座）
                KANYUSY_EXP_TORK_K: kanyusyExpTopkK, // 拡張情報
                NISA_KOZA_MSKM: nisaKozaMskm, // NISA口座開設
                NISA_MOSIKOMI_YEAR: gyomuYyyy, // 申込み日の属する年
                HIREIHAIBUN: hireihaibun, // 株式数比例配分方式
                MYNO_KOKUCHI: mynoKokuchi, // 個人番号の登録
                FURIKOMI_KOZA: furikomiKoza, // 振込先口座[X]
                SUKN: sukn, // 支払方法（利金・分配金）
                SUKN_HKT_MEIG_K: suknHktMeigK, // 包括へ変更
                SUKN_HEN: suknYen, // 支払方法（外証）
                RUITOU_SUKN: ruitouSukn, // 支払方法（累投）
                HAITKN_SYKN_UKTR_MSKM: haitknSyknUktrMskm, // 申込区分（配当金受領方式）
                AMEIG_FURIKOMI: ameigFurikomi, // 受取方法（配当金受領方式）
            }
        }

        // データ（申込）
        var dataMosikomiInit = function () {
            // 番号確認書類
            var mnsyseiryK = getCodeInfo('NMBR_KAKNN_SHOR', mnsyseiryJoho.MNSYSEIRY_K);
            // 個人番号
            var myno = getString(personInfo.MYNO);
            // 本人確認書類１種類目タイトル
            var honinKakninSyK1 = getCodeInfo('HONIN_KAKNIN_SY', honinKakninSyJoho.HONIN_KAKNIN_SY_K_1);
            // 本人確認書類１種類目１枚目画像
            var honinKakninSy1Gazo1 = stringJoin(strConst.EMPTY_CHAR, strConst.BASE64_HEAD, imageData.HONIN_KAKNIN_SY1_GAZO1);
            // 本人確認書類１種類目２枚目画像
            var honinKakninSy1Gazo2 = stringJoin(strConst.EMPTY_CHAR, strConst.BASE64_HEAD, imageData.HONIN_KAKNIN_SY1_GAZO2);
            // 本人確認書類１種類目３枚目画像
            var honinKakninSy1Gazo3 = stringJoin(strConst.EMPTY_CHAR, strConst.BASE64_HEAD, imageData.HONIN_KAKNIN_SY1_GAZO3);
            // 本人確認書類２種類目タイトル
            var honinKakninSyK2 = getCodeInfo('HONIN_KAKNIN_SY', honinKakninSyJoho.HONIN_KAKNIN_SY_K_2);
            // 本人確認書類２種類目１枚目画像
            var honinKakninSy2Gazo1 = stringJoin(strConst.EMPTY_CHAR, strConst.BASE64_HEAD, imageData.HONIN_KAKNIN_SY2_GAZO1);
            // 本人確認書類２種類目２枚目画像
            var honinKakninSy2Gazo2 = stringJoin(strConst.EMPTY_CHAR, strConst.BASE64_HEAD, imageData.HONIN_KAKNIN_SY2_GAZO2);
            // 本人確認書類２種類目３枚目画像
            var honinKakninSy2Gazo3 = stringJoin(strConst.EMPTY_CHAR, strConst.BASE64_HEAD, imageData.HONIN_KAKNIN_SY2_GAZO3);

            $scope.dataMosikomi = {
                MNSYSEIRY_K: mnsyseiryK, // 番号確認書類
                MYNO: myno, // 個人番号
                HONIN_KAKNIN_SY_K_1: honinKakninSyK1, // 本人確認書類１種類目タイトル
                HONIN_KAKNIN_SY1_GAZO1: honinKakninSy1Gazo1, // 本人確認書類１種類目１枚目画像
                HONIN_KAKNIN_SY1_GAZO2: honinKakninSy1Gazo2, // 本人確認書類１種類目２枚目画像
                HONIN_KAKNIN_SY1_GAZO3: honinKakninSy1Gazo3, // 本人確認書類１種類目３枚目画像
                HONIN_KAKNIN_SY_K_2: honinKakninSyK2, // 本人確認書類２種類目タイトル
                HONIN_KAKNIN_SY2_GAZO1: honinKakninSy2Gazo1, // 本人確認書類２種類目１枚目画像
                HONIN_KAKNIN_SY2_GAZO2: honinKakninSy2Gazo2, // 本人確認書類２種類目２枚目画像
                HONIN_KAKNIN_SY2_GAZO3: honinKakninSy2Gazo3, // 本人確認書類２種類目３枚目画像
            }
        }

        var pageShowInit = function () {

            // 画面遷移制御用フラグ.入力画面遷移制御.振込先口座削除フラグ[X]
            var kozaDelF = '0';
            for (var i = 0; i < inputFlgControl.KOZA_DEL_F.length; i++) {
                if ('1' === getString(inputFlgControl.KOZA_DEL_F[i])) {
                    kozaDelF = '1';
                    break;
                }
            }

            // 申込データ(事務手続き).事務手続き情報.日興カード申込区分が「１.新規」、「3.再発行」の場合
            // 日興カード暗証番号
            var showNikoPin = '1' === getString(jimuJoho.NIKKO_CARD) || '3' === getString(jimuJoho.NIKKO_CARD);

            // 申込データ(事務手続き).事務手続き情報.特定口座申込区分が「2：変更」
            // 源泉徴収変更予約
            var showTkteiKozaYyk = '2' === getString(jimuJoho.TKTEI_KOZA_MSKM);

            // 申込データ(事務手続き).事務手続き情報.特定口座申込区分が「3：廃止」
            // 特定口座「廃止」項目
            var showTkteiKozaHisi = '3' === getString(jimuJoho.TKTEI_KOZA_MSKM);

            // 特定口座源泉徴収選択・配当等受入説明文（変更後）
            var showTkteiKozaGnsnMsg = getString(jimuJoho.TKTEI_KOZA_GNSN);

            // NISA口座開設説明文（変更後）
            var showNisaKozaMskmMsg = getString(jimuJoho.NISA_KOZA_MSKM);

            // 申込データ(事務手続き).事務手続き情報.配当金受領方式申込区分が「3: 抹消」ではないの場合
            // 受取方法（配当金受領方式）
            var showAmeigFurikomi = '3' !== getString(jimuJoho.HAITKN_SYKN_UKTR_MSKM);

            //  画面遷移制御用フラグ.入力画面遷移制御の各フラグ中にいずれかが「false」の場合表示する
            // 変更が不要ラベル
            var showNoEditLebel = false;
            for (var key in inputFlgControl) {
                if ('KOZA_DEL_F' == key) {
                    for (var j = 0; j < inputFlgControl[key].length; j++) {
                        var a = 0;
                        if ('0' === getString(inputFlgControl[key][j])) {
                            a ++;
                            if (9 == a) {
                                showNoEditLebel = true;
                                break;
                            }
                        }
                    }
                }
                else if ('0' === getString(inputFlgControl[key])) {
                    showNoEditLebel = true;
                    break;
                }
            }

            // 変更が不要ラベル第一タイトル表示
            var showNoEditFirstTitle = true;
            for (var key in inputFlgControl) {
                if ('KOZA_DEL_F' == key) {
                    for (var j = 0; j < inputFlgControl[key].length; j++) {
                        if ('1' === getString(inputFlgControl[key][j])) {
                            showNoEditFirstTitle = false;
                            break;
                        }
                    }
                }
                else if ('1' === getString(inputFlgControl[key])) {
                    showNoEditFirstTitle = false;
                    break;
                }
            }

            // 本人確認書類郵送区分（1種類目）
            var showImageHnKnSyYuK1 = '2' === getString(honinKakninSyJoho.HONIN_KAKNIN_SY_YUSO_K_1);

            // 「申込データ(事務手続き).本人確認書類情報.本人確認書類区分（1種類目）」 任意
            // 本人確認書類１種類目１枚目画像
            var showImageHnKnSy1Gz1 = !showImageHnKnSyYuK1 && !!honinKakninSyJoho.HONIN_KAKNIN_SY_K_1;

            // 「申込データ(事務手続き).本人確認書類情報.本人確認書類区分（1種類目）」 01:個人番号カード以外
            // 本人確認書類１種類目２枚目画像
            var showImageHnKnSy1Gz2 = showImageHnKnSy1Gz1 && '01' !== getString(honinKakninSyJoho.HONIN_KAKNIN_SY_K_1);
            var imageHnKnSy1Gz2Exist = !!imageData.HONIN_KAKNIN_SY1_GAZO2;

            // 「申込データ(事務手続き).本人確認書類情報.本人確認書類区分（1種類目）」 　07:その他（顔写真あり）、12:住民票の写し、14:その他（顔写真なし）、15:その他２（顔写真なし）
            // 本人確認書類１種類目３枚目画像
            var showImageHnKnSy1Gz3 = showImageHnKnSy1Gz2 && ['07', '12', '14', '15'].indexOf(honinKakninSyJoho.HONIN_KAKNIN_SY_K_1) > -1;
            var imageHnKnSy1Gz3Exist = !!imageData.HONIN_KAKNIN_SY1_GAZO3;

            // 本人確認書類郵送区分（2種類目）
            var showImageHnKnSyYuK2 = '2' === getString(honinKakninSyJoho.HONIN_KAKNIN_SY_YUSO_K_2);

            // 「申込データ(事務手続き).本人確認書類情報.本人確認書類区分（2種類目）」 任意
            // 本人確認書類２種類目
            var showHnKnSy2Title = !!honinKakninSyJoho.HONIN_KAKNIN_SY_K_2;

            // 「申込み内容データ.撮影画像データ.本人確認書類２種類目」 任意
            // 本人確認書類２種類目１枚目画像
            var showImageHnKnSy2Gz1 = !showImageHnKnSyYuK2 && showHnKnSy2Title;

            // 「申込み内容データ.撮影画像データ.本人確認書類２種類目」 任意
            // 本人確認書類２種類目２枚目画像
            var showImageHnKnSy2Gz2 = showImageHnKnSy2Gz1;
            var imageHnKnSy2Gz2Exist = !!imageData.HONIN_KAKNIN_SY2_GAZO2;

            // 「申込み内容データ.撮影画像データ.本人確認書類２種類目」 07:その他（顔写真あり）、12:住民票の写し、14:その他（顔写真なし）、15:その他２（顔写真なし）
            // 本人確認書類２種類目３枚目画像
            var showImageHnKnSy2Gz3 = showImageHnKnSy2Gz2 && ['07', '12', '14', '15'].indexOf(honinKakninSyJoho.HONIN_KAKNIN_SY_K_2) > -1;
            var imageHnKnSy2Gz3Exist = !!imageData.HONIN_KAKNIN_SY2_GAZO3;

            // 外証の円貨利金分配金振込銀行（銘柄）
            var showMeigKozaNasi = !angular.isArray(gaikBankMeig) || gaikBankMeig.length === 0;

            // 源泉徴収区分 1  転居日 年初住所
            var showTkteiKozaGnsn = '1' === getString(customer.TKTEI_KOZA_GNSN);

            $scope.pageShow = {
                KYAKNM_F: inputFlgControl.KYAKNM_F, // おなまえ変更フラグ
                KYAK_ADDR_F: inputFlgControl.KYAK_ADDR_F, // ご住所変更フラグ
                TELNO_F: inputFlgControl.TELNO_F, // 電話番号変更フラグ
                NIKKO_MRF_F: inputFlgControl.NIKKO_MRF_F, // 日興MRF変更フラグ
                NIKKO_CARD_F: inputFlgControl.NIKKO_CARD_F, // 日興カード変更フラグ
                NIKKO_EZ_F: inputFlgControl.NIKKO_EZ_F, // 日興EZ変更フラグ
                GAIK_SYKN_KOZA_F: inputFlgControl.GAIK_SYKN_KOZA_F, // 外国証券取引口座変更フラグ
                TKTEI_KOZA_F: inputFlgControl.TKTEI_KOZA_F, // 特定口座変更フラグ
                TKTEI_KANRI_KOZA_F: inputFlgControl.TKTEI_KANRI_KOZA_F, // 特定管理口座変更フラグ
                KANYUSY_EXP_F: inputFlgControl.KANYUSY_EXP_F, // 加入者情報拡張登録変更フラグ
                NISA_KOZA_F: inputFlgControl.NISA_KOZA_F, // NISA口座開設フラグ
                MYNO_KOKUCHI_F: inputFlgControl.MYNO_KOKUCHI_F, // 個人番号告知フラグ
                KOZA_DEL_F: kozaDelF, // 振込先口座削除フラグ
                BK_KOZA_ADD_F: inputFlgControl.BK_KOZA_ADD_F, // 振込先銀行登録フラグ
                YUCH_KOZA_ADD_F: inputFlgControl.YUCH_KOZA_ADD_F, // 振込先ゆうちょ登録フラグ
                SUKN_HKT_F: inputFlgControl.SUKN_HKT_F, // 利金・分配金支払方法（包括）変更フラグ
                SUKN_HKT_MEIG_F: inputFlgControl.SUKN_HKT_MEIG_F, // 利金・分配金支払方法（銘柄）変更フラグ
                GAIK_SYKN_YEN_F: inputFlgControl.GAIK_SYKN_YEN_F, // 外国証券の円貨利金分配金振込銀行変更フラグ
                RUITOU_SUKN_KAIT_TEIS_F: inputFlgControl.RUITOU_SUKN_KAIT_TEIS_F, // 累投（株投型）分配金買付停止変更フラグ
                HAITKN_SYKN_UKTR_F: inputFlgControl.HAITKN_SYKN_UKTR_F, // 配当金受領方式変更フラグ
                MYNO_KOKUCHI_JISN: ('1' === getString(inputFlgControl.MYNO_KOKUCHI_F) || '1' === getString(jimuJoho.MNSYSEIRY_JISN_FLAG)), // 個人番号告知または持参ありフラグ

                showNikoPin: showNikoPin, // 日興カード暗証番号
                showTkteiKozaYyk: showTkteiKozaYyk, // 源泉徴収変更予約
                showTkteiKozaHisi: showTkteiKozaHisi, // 特定口座「廃止」項目
                showTkteiKozaGnsnMsg: showTkteiKozaGnsnMsg, // 特定口座源泉徴収選択・配当等受入説明文（変更後）
                showNisaKozaMskmMsg: showNisaKozaMskmMsg, // NISA口座開設説明文（変更後）
                showAmeigFurikomi: showAmeigFurikomi, // 受取方法（配当金受領方式）
                showNoEditLebel: showNoEditLebel, // 変更が不要ラベル
                showNoEditFirstTitle: showNoEditFirstTitle, // 変更が不要ラベル第一タイトル表示
                showImageHnKnSy1Gz1: showImageHnKnSy1Gz1, // 本人確認書類１種類目１枚目画像
                showImageHnKnSy1Gz2: showImageHnKnSy1Gz2, // 本人確認書類１種類目２枚目画像
                imageHnKnSy1Gz2Exist: imageHnKnSy1Gz2Exist,
                showImageHnKnSy1Gz3: showImageHnKnSy1Gz3, // 本人確認書類１種類目３枚目画像
                imageHnKnSy1Gz3Exist: imageHnKnSy1Gz3Exist,
                showImageHnKnSyYuK1: showImageHnKnSyYuK1, // 本人確認書類郵送区分（1種類目）
                showHnKnSy2Title: showHnKnSy2Title, // 本人確認書類２種類目
                showImageHnKnSy2Gz1: showImageHnKnSy2Gz1, // 本人確認書類２種類目１枚目画像
                showImageHnKnSy2Gz2: showImageHnKnSy2Gz2, // 本人確認書類２種類目２枚目画像
                imageHnKnSy2Gz2Exist: imageHnKnSy2Gz2Exist,
                showImageHnKnSy2Gz3: showImageHnKnSy2Gz3, // 本人確認書類２種類目３枚目画像
                imageHnKnSy2Gz3Exist: imageHnKnSy2Gz3Exist,
                showImageHnKnSyYuK2: showImageHnKnSyYuK2, // 本人確認書類郵送区分（2種類目）
                showMeigKozaNasi: showMeigKozaNasi, // 外証の円貨利金分配金振込銀行（銘柄）
                showTkteiKozaGnsn: showTkteiKozaGnsn // 源泉徴収区分
            }
        }

        var initAll = function () {
            loadApplyInfo();
            dataBeforeInit();
            dataAfterInit();
            dataMosikomiInit();
            pageShowInit();
        }

        initAll();

        $scope.$on('$destroy', function() {
            $scope = null;
        });
    }]);