/// <reference path="../reference.d.ts" />
/*
    修正履歴
    2020/11/19 インシデント対応 ITI本夛
    振込先口座の登録番号削除の際、登録番号でなく配列のインデックスに基づいて処理がされているため修正。
 */

App.controller('inputNotificationsController', ['$scope', '$routeParams', '$anchorScroll', '$timeout', '$controller', 'AppCom', 'AppBizCom', 'logicCom', 'AppLgcMultiCheck', 'chkSimilarConst', 'AppBizNaviScroll', 'appDefine', 'AppLgcApplyAssign', 'AppBizMsg',
    function ($scope, $routeParams, $anchorScroll, $timeout, $controller, AppCom, AppBizCom, logicCom, AppLgcMultiCheck, chkSimilarConst, AppBizNaviScroll, appDefine, AppLgcApplyAssign, AppBizMsg) {

        // SFJ-21:住所検索機能
        $controller('addressSearchController', { $scope: $scope });
        // SFJ-22:金融機関検索機能
        $controller('bankSearchController', { $scope: $scope });
        // SFJ-24:詳細リンク機能
        $controller('detailModalController', { $scope: $scope });

        // ボタンをクリックしたフラグ
        var isBtnClickedFlg = false;
        var emptyCallback = function () { };
        // 通信エラー発生する場合、「閉じる」ボタン押下時に、「画面制御 二重制御」フラグを解除する
        var connectionErrorCallback = function () {
            isBtnClickedFlg = false;
        };

        // 業務データ項目別定義
        var stringConst = {
            ZeroYMD: '00000000',
            NineYMD: '99999999',
            Mihakko: '未発行',
            Mimoshikomi: '未申込',
            Mikaisetsu: '未開設',
            MikaisetsuMoshikomichu: '未開設（申込中）',
            Nasi: 'なし',
            Ari: 'あり',
            Kakuninyo: '確認要',
            MiShinkoku: '未申告',
            FullSpace: '　',
            EmptyChar: '',
        };

        // 西暦のコードを保持用
        var tnkyGngoAD = undefined;
        // 業務日付
        var serviceTimeInfo = AppBizCom.DataHolder.getServiceTime();
        var gyomuDate = serviceTimeInfo.GYOMU_DATE.substring(0, 4) + '-' + serviceTimeInfo.GYOMU_DATE.substring(4, 6) + '-' + serviceTimeInfo.GYOMU_DATE.substring(6, 8);

        /**---------------------------------------------------------------
         * '0'を左に埋め込む処理
         *
         * @param {string} target - 入力値
         * @param {string} length - 入力桁数
         * @param {string} padString - 埋め込む文字、ディフォルト値は「'0'」
         * @return {string} - 埋め込む結果文字列
         */
        var padLeft = function (target, length, padString = '0') {
            return !angular.isString(target) || target.length >= length ? target : new Array(length - target.length).fill(padString).join('') + target;
        };

        /**---------------------------------------------------------------
         * 元文字列がundefinedの場合、ディフォルト値をセットする処理
         *
         * @param {string} val - 元文字列
         * @param {string} defualtVal - セット用のディフォルト値
         * @param {string} compareDefault - 比較用データ、ディフォルト値は「undefined」
         * @return {string} - 取り出す結果文字列
         */
        var getDefault = function (val, defualtVal, compareDefault = undefined) {
            return val === compareDefault ? defualtVal : val;
        };

        /**---------------------------------------------------------------
         * 元文字列の一部分を取り出す処理
         *
         * @param {string} val - 元文字列
         * @param {string} start - 開始インデックス
         * @param {string} end - 終了インデックス
         * @return {string} - 取り出す結果文字列
         */
        var subStr = function (val, start, end?) {
            return val && angular.isString(val) && val.slice(start, end);
        };

        /**---------------------------------------------------------------
         * 桁数より、元文字列を分割する処理（ご住所③、ご住所③カナ）
         *
         * @param {string} val - 元文字列
         * @param {string} arrayLength - 分割後の配列の最大length
         * @param {Array} perLengths - 分割後の配列の各要素のlength
         * @return {Array} - 分割後の結果
         */
        var addr3SplitByDigit = function (val, arrayLength, ...perLengths) {
            var res = new Array(arrayLength).fill(undefined);
            if(undefined == val){
                return res;
            }
            var startValIndex = perLengths.length;
            perLengths.length = arrayLength;
            perLengths.fill(perLengths[startValIndex-1], startValIndex);
            var begin = 0, end = 0;
            for (var i = 0; i < arrayLength; i++) {
                end = end + perLengths[i];
                res[i] = val.slice(begin, end) || undefined;
                begin = end;
            }
            return res;
        };
        /**---------------------------------------------------------------
         * 全角スペースより、元文字列を分割する処理（ご住所③、ご住所③カナ）
         *
         * @param {string} val - 元文字列
         * @param {string} arrayLength - 分割後の配列の最大length
         * @param {string} kugiri - 区切り文字
         * @return {Array} - 分割後の結果
         */
        var addr3SplitBySpace = function (val, arrayLength, kugiri) {
            var res = new Array(arrayLength).fill(undefined);
            if(undefined == val){
                return res;
            }
            var tmpArray = val.split('　');
            for (var i = 0; i < arrayLength; i++) {
                res[i] = tmpArray[i] || undefined;
            }
            res = res.filter(e => e != undefined);
            return res;
        };


        /**---------------------------------------------------------------
         * マスタ情報から指定プロパティで検索する処理
         *
         * @param {string} value - 入力値
         * @param {Array} list - マスタ情報取得結果
         * @param {string} notFoundVal - 結果なしの場合の返却値、ディフォルト値は「''」
         * @param {string} resProp - 検索対象、ディフォルト値は「'MSY'」
         * @param {string} getProp - 検索用キーワード、ディフォルト値は「'CD'」
         * @return {string} - 検索結果文字列
         */
        var getFromCodeList = function(value, list, notFoundVal = '', resProp = 'MSY', getProp = 'CD'){
            var e = list.find(e => e[getProp] == value);
            return e && e[resProp] ? e[resProp] : notFoundVal;
        }

        /**---------------------------------------------------------------
         * マスタ情報から指定プロパティの結果を検索する処理
         *
         * @param {string} val - 入力値
         * @param {string} kbn - マスタ区分
         * @param {string} prep - 検索対象、ディフォルト値は「'MSY'」
         * @param {string} defaultVal - ディフォルト値は「undefined」
         * @return {string} - 検索結果文字列
         */
        var getNmWithCd = function (val, kbn, prep = 'MSY', defaultVal = undefined) {
            if (!val) return defaultVal;
            var mstData = AppBizCom.MstData.getCodeMstDataByCd(kbn, val);
            return mstData && mstData[prep] ? mstData[prep] : defaultVal;
        };

        /**---------------------------------------------------------------
         * 年月日正規化処理（xxxx年 xx月 xx日）（変更前）出力編集
         *
         * @param {string} val - 入力値
         * @param {string} defaultVal - ディフォルト値
         * @param {string} compareDefault - 比較対象、ディフォルト値は「'00000000'」
         * @return {string} - 正規化した結果「'xxxx年 xx月 xx日'」
         */
        var formatYMD = function (val, defualtVal, compareDefault = stringConst.ZeroYMD) {
            return val === compareDefault || typeof val != 'string' ? defualtVal : val.replace(/(\d{4})(\d{2})(\d{2})/, '$1年 $2月 $3日');
        };

        /**---------------------------------------------------------------
         * 年月日正規化処理（xxxx年）（変更前）出力編集
         *
         * @param {string} val - 入力値
         * @return {string} - 正規化した結果「'xxxx年'」
         */
        var formatYMDY = function (val) {
            var result = stringConst.EmptyChar;
            // 「00000000」の場合、「未開設」と表示する
            if (val === stringConst.ZeroYMD) {
                result = stringConst.Mikaisetsu;
            }
            // 「99999999」の場合、「未開設（申込中）」と表示する
            else if (val === stringConst.NineYMD) {
                result = stringConst.MikaisetsuMoshikomichu;
            } 
            // 上記以外の場合（yyyymmdd）、 「xxxx年」と表示する
            else if (typeof val == 'string' && val.length === 8) {
                result = val.replace(/(\d{4})(\d{2})(\d{2})/, '$1年');
            }
            return result;
        };

        /**---------------------------------------------------------------
         * 特定口座年初取引（変更前）出力編集
         *
         * @param {string} val - 入力値
         * @return {string} - 編集した結果
         */
        var getTkteiKozaNensyTorihiki = function (val) {
            // 「00000000」の場合、「なし」と表示する
            if (val === stringConst.ZeroYMD) {
                return stringConst.Nasi;
            } else if (angular.isString(val) && val.slice(0, 4) == new Date(gyomuDate).getFullYear().toString()) {
                // 当年の場合、「あり」と表示する。
                return stringConst.Ari;
            } else {
                // 当年ではない場合、「確認要」と表示する。
                return stringConst.Kakuninyo;
            }
        };

        /**---------------------------------------------------------------
         * 当社から送金する際のお受取口座（変更前）出力編集
         *
         * @param {Array} val - 入力値
         * @return {Array} - 編集した結果
         */
        var getKozaBeforeArray = function (val) {
            if (val == undefined || !angular.isArray(val)) return [];

            val.forEach(e => {
                // 登録銀行No
                e.KOZA_TRKNO = padLeft(e.KOZA_TRKNO, 2);
                // 預金種目
                e.BK_YOKNKND && (e.BK_YOKNKND_NM = getNmWithCd(e.BK_YOKNKND, 'BK_YOKNKND'))
                // 支店コード
                e.KOZA_MISE_C && (e.KOZA_MISE_C = e.KOZA_MISE_C.slice(-3));
            });
            return val;
        };

        /**---------------------------------------------------------------
         * 当社から送金する際のお受取口座（追加分）出力編集
         *
         * @param {Array} val - 入力値
         * @return {Array} - 編集した結果
         */
        var getKozaAddArray = function (val) {
            if (val === undefined || !angular.isArray(val)) return [];

            val.forEach(e => {
                // お受取口座
                e.KOZA_KBN = e.KOZA_UKTRKZ;
            });

            return val;
        };

        /**---------------------------------------------------------------
         * 利金・分配金支払方法（包括）（変更前）出力編集
         *
         * @return {string} - 編集した結果
         */
        var getSuknHoukatu = function () {
            var res;

            if ($scope.suknBefore.SUKN_SITEI_K == '0' || $scope.suknBefore.SUKN_SITEI_K == '3') {
                // 「0：包括」、または「3：包括＆銘柄」の場合
                switch ($scope.suknBefore.SUKN_SYURUI_K) {
                    case '11':
                        // 11:公社債投信の買付入金
                        res = 'ハイパック：公社債投信コース';
                        break;
                    case '20':
                    case '30':
                        // 「20:銀行振込出金」、「30:郵貯」
                        res = '登録銀行No ' + padLeft($scope.suknBefore.SUKN_HKT_BK, 2);
                        break;
                    case '50':
                        // 50:預り金へ入金
                        res = '預り金へ入金';
                        break;
                    default:
                        res = 'その他';
                        break;
                }
            } else {
                // 「0：包括」、または「3：包括＆銘柄」以外の場合、「なし」で出力する。
                res = stringConst.Nasi;
            }

            return res;
        };

        /**---------------------------------------------------------------
         * 利金・分配金支払方法（銘柄）（変更前）出力編集
         *
         * @param {string} val - 入力値
         * @return {string} - 編集した結果
         */
        var getSuknMeigara = function (val) {
            // 顧客契約情報の利金・分配金支払方法銘柄包括指定区分（SUKN_SITEI_K）が"1：個別"、または"3：包括＆銘柄"の場合、「あり」を出力する、それ以外のばあい「なし」を出力する
            return (val == '1' || val == '3') ? stringConst.Ari : stringConst.Nasi;
        };

        /**---------------------------------------------------------------
         * 外国証券の円貨利金分配金振込銀行(包括)（変更前）出力編集
         *
         * @param {string} val - 入力値
         * @return {string} - 編集した結果
         */
        var getGaikSunkHoukatsu = function (val) {
            return (val == '' || val == undefined) ? stringConst.Nasi : '登録銀行No ' + padLeft(val, 2);
        };

        /**---------------------------------------------------------------
         * 外国証券の円貨利金分配金振込銀行(銘柄／受取口座)（変更前）出力編集
         *
         * @param {Array} val - 入力値
         * @return {Array} - 編集した結果
         */
        var getGaiSunkMeigara = function (val) {
            if (val == undefined || !angular.isArray(val)) return [];

            val.forEach(e => {
                // 登録銀行No
                e.GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA = padLeft(e.GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA, 2);
            });
            return val;
        };

        /**---------------------------------------------------------------
         * 外国証券の円貨利金分配金振込銀行(銘柄／受取口座)（変更前）出力編集 （銘柄／受取口座なしの場合）
         *
         * @param {Array} val - 入力値
         * @return {boolean} - 編集した結果
         */
        var getGaiSunkMeigaraNasi = function (val) {
            if (val == undefined || !angular.isArray(val) || val.length == 0) return true;
            return false;
        };

        /**---------------------------------------------------------------
         * 配当金受領方式（変更前）出力編集
         *
         * @param {string} val - 入力値
         * @return {string} - 編集した結果
         */
        var getHaitKin = function () {
            switch ($scope.haitkinSunkBefore.HIREIHAIBUN) {
                case '0':
                    return '指定なし';
                case '1':
                    return '全銘柄振込先指定方式　登録銀行No ' + padLeft($scope.haitkinSunkBefore.AMEIG_FURIKOMI, 2);
                case '2':
                    return '株式数比例配分方式';
            }
        };

        /**---------------------------------------------------------------
         * 配当金受領方式出力編集
         *
         * @param {string} val - 入力値
         * @return {string} - 編集した結果
         */
        var getAmeigFurikomiChk = function (val) {
            return val !== undefined ? '1' : undefined;
        };

        // 変更前データ定義
        var beforeEditDataDefine = {
            // お客様口座情報
            kozaInfo: [
                { target: 'KOZA_OPEN_YMD', get: [formatYMD] }, // 口座開設日
                'MISE_C',  // 店部課コード
                'KYAK_CIF_C' // 顧客コード
            ],
            // おなまえ
            nameBefore: [
                'KYAKNM_SEI_KNJ',  // 顧客姓（漢字）
                'KYAKNM_MEI_KNJ',  // 顧客名（漢字）
                'KYAKNM_SEI_KANA',  // 顧客姓（カナ）
                'KYAKNM_MEI_KANA' // 顧客名（カナ）
            ],
            // ご住所
            addrBefore: [
                'YUBINNO',  // 郵便番号
                'KYAK_ADDR_KNJ',  // 顧客住所漢字
                'KYAK_ADDR_KANA',  // 顧客住所カナ
                'KYAK_HOSK_ADDR_KNJ',  // 補足住所漢字
                'KYAK_HOSK_ADDR_KANA',  // 補足住所フリガナ
                'KYAK_HOUSENM_KNJ',  // 建物名漢字
                'KYAK_HOUSENM_KANA',  // 建物名フリガナ
                'SOUHUSAKI_YBN_BNG',  // 送付先新郵便番号
                'SOUHUSAKI_JYSY_KNJ', // 送付先住所漢字
                'SOUHUSAKI_JYSY_KN' // 送付先住所カナ
            ],
            // 電話番号
            telsBefore: [
                'TELNO1',  // 自宅電話番号１
                'TELNO2',  // 自宅電話番号２
                'TELNO3',  // 自宅電話番号３
                'MOBILE_TELNO1',  // 携帯電話番号１
                'MOBILE_TELNO2',  // 携帯電話番号２
                'MOBILE_TELNO3',  // 携帯電話番号３
                'FAXNO1',  // FAX番号１
                'FAXNO2',  // FAX番号２
                'FAXNO3' // FAX番号３
            ],
            // 日興MRF累積投資口座（証券総合口座取引）
            mrfBefore: [
                { target: 'NIKKO_MRF', get: [getNmWithCd, 'KIYK_K'] } // 日興MRF累積投資口座
            ],
            // 日興カード
            nkCardBefore: [
                { target: 'NIKKO_CARD', get: [formatYMD, stringConst.Mihakko] } // 日興カード発行日
            ],
            // 日興イージートレード
            ezTradeBefore: [
                { target: 'NIKKO_EZ', get: [formatYMD, stringConst.Mimoshikomi] },  // 日興イージートレード申込日
                { target: 'DNS_KOFU_SRV', get: [getNmWithCd, 'KIYK_K'] } // 電子交付サービス
            ],
            // 外国証券取引口座
            gaikSyknKozaBefore: [
                { target: 'GAIK_SYKN_KOZA_OPENYMD', get: [formatYMD, stringConst.Mikaisetsu] } // 外国証券取引口座開設日
            ],
            // 特定口座
            tkKozaBefore: [
                { target: 'TKTEI_KOZA_OPENYMD', get: [formatYMD, stringConst.Mikaisetsu] },  // 特定口座開設日
                'TKTEI_KOZA_AC',  // 特定口座勘定区分
                { target: 'TKTEI_KOZA_AC', key: 'TKTEI_KOZA_AC_NM', get: [getNmWithCd, 'ACKBN'] },  // 特定口座勘定区分（出力編集仕様）
                'TKTEI_KOZA_GNSN', // 特定口座源徴区分
                { target: 'TKTEI_KOZA_GNSN', key: 'TKTEI_KOZA_GNSN_NM', get: [getNmWithCd, 'GNSEN_TYOSYU_K'] },  // 源泉徴収区分（出力編集仕様）
                'TKTEI_KOZA_YYKYMD',  // 特定口座源徴予約日
                'TKTEI_KOZA_YYK',  // 特定口座予約情報
                // { target: 'TKTEI_KOZA_YYK', key: 'TKTEI_KOZA_YYK_NM', get: [getNmWithCd, 'GNSEN_TYOSYU_K'] },  // 特定口座予約情報（出力編集仕様）
                // { target: 'TKTEI_KOZA_NENSY_TORIHIKIYMD', get: [getTkteiKozaNensyTorihiki] } // 特定口座年初取引
                'TKTEI_KOZA_NENSY_TORIHIKIYMD' // 特定口座年初取引
            ],
            // 特定管理口座
            tkKanriKozaBefore: [
                { target: 'TKTEI_KANRI_KOZA_OPENYMD', get: [formatYMD, stringConst.Mikaisetsu] } // 特定管理口座開設日
            ],
            // 加入者情報拡張登録
            kaNyuBefore: [
                'KAKU_KYAKNM_KNJ',  // 加入者情報拡張情報（顧客名）
                'KAKU_YUBINNO',  // 加入者情報拡張情報（郵便番号）
                'KAKU_ADDR' // 加入者情報拡張情報（住所）
            ],
            // NISA口座開設
            nisaBefore: [
                { target: 'NISA_KOZA_OPENYMD', get: [formatYMDY] }  // NISA口座開設日
            ],
            // 個人番号告知
            myNumberBefore: [
                'MYNO_KKC',  // マイナンバー告知
                { target: 'MYNO_KKC', key: 'MYNO_KKC_NM', get: [getNmWithCd, 'KKCH_K', , stringConst.MiShinkoku] } // 告知状態（出力編集仕様）
            ],
            // 当社から送金する際のお受取口座
            kozaBefore: [
                { target: 'KOZA', get: [getKozaBeforeArray] } // 振込先口座「0~9」
            ],
            // 利金・分配金支払方法
            suknBefore: [
                'SUKN_SITEI_K',  // 利金・分配金支払方法銘柄包括指定区分
                'SUKN_SYURUI_K',  // 利金・分配金支払方法種類
                'SUKN_HKT_BK',  // 利金・分配金支払方法包括登録銀行No
                { target: 'SUKN_HOUKATSU', get: [getSuknHoukatu] }, // 包括（出力編集仕様）
                { target: 'SUKN_SITEI_K', key: 'SUN_MEIGARA', get: [getSuknMeigara] } // 銘柄（出力編集仕様）
            ],
            // 外国証券の円貨利金分配金振込銀行
            gaikSunkBefore: [
                { target: 'GAIK_SYKN_YEN_SUKN_BK_HKT', get: [getGaikSunkHoukatsu] },  // 外証の円貨利金分配金振込銀行（包括）
                { target: 'GAIK_SYKN_YEN_SUKN_BK_MEIG', get: [getGaiSunkMeigara] },  // 外証の円貨利金分配金振込銀行（銘柄）
                { target: 'GAIK_SYKN_YEN_SUKN_BK_MEIG', key: 'GAIK_SYKN_YEN_SUKN_BK_MEIG_NASI', get: [getGaiSunkMeigaraNasi] }  // 外証の円貨利金分配金振込銀行（銘柄）（銘柄／受取口座なしの場合の出力編集仕様）
            ],
            // 配当金受領方式
            haitkinSunkBefore: [
                'HIREIHAIBUN',  // 振替株式の配当金等の証券口座受取申込（配当金受領方式）
                'AMEIG_FURIKOMI',  // 振替株式の配当金等の証券口座受取申込（全銘柄振込先指定方式）
                { target: 'HAITKIN', get: [getHaitKin] } // 配当金受領方式（出力編集仕様）
            ],
            // その他
            otherBefore: [
                'DIRECT_K',  // ダイレクトコース申込
                'GNGO',  // 元号（生年月日）
                'SEINENYMD' // 和暦年月日（生年月日）
            ],
        };

        // 事務手続き情報
        var notifInfoDefine = {
            // おなまえ
            name: [
                'KYAKNM_SEI_KNJ', // 顧客姓（漢字）
                'KYAKNM_MEI_KNJ', // 顧客名（漢字）
                'KYAKNM_SEI_KANA', // 顧客姓（カナ）
                'KYAKNM_MEI_KANA' // 顧客名（カナ）
            ],
            // ご住所
            addr: [
                'TIIKI_C', // 地域コード
                'YUBINNO', // 郵便番号
                { target: 'YUBINNO', key: 'YUBINNO_1', get: [subStr, 0, 3] }, // 郵便番号（上３桁）（出力編集仕様）
                { target: 'YUBINNO', key: 'YUBINNO_2', get: [subStr, 3] }, // 郵便番号（下４桁）（出力編集仕様）
                { target: 'KYAK_ADDR_FLAG', get: [getDefault, '0'] }, // 住所入力フラグ
                'KYAK_ADDR_KNJ', // 顧客住所漢字
                'KYAK_ADDR_KANA', // 顧客住所フリガナ
                'KYAK_ADDR_TDHKN', // 都道府県
                'KYAK_HOSK_ADDR_KNJ', // 補足住所漢字
                'KYAK_HOSK_ADDR_KANA', // 補足住所フリガナ
                'KYAK_HOUSENM_KNJ', // 建物名漢字
                { target: 'KYAK_HOUSENM_KNJ', key: 'KYAK_HOUSENM_KNJS', get: [addr3SplitBySpace, 3, '　'] }, // 建物名漢字（出力編集仕様）
                'KYAK_HOUSENM_KANA', // 建物名フリガナ
                { target: 'KYAK_HOUSENM_KANA', key: 'KYAK_HOUSENM_KANAS', get: [addr3SplitBySpace, 3, '　'] }, // 建物名フリガナ（出力編集仕様）
                'TNKY_GNGO', // 転居日元号
                'TNKYYMD', // 転居日
                { target: 'TNKYYMD', key: 'TNKYY', get: [subStr, 0, -4] }, // 転居日（年）（出力編集仕様）
                { target: 'TNKYYMD', key: 'TNKYM', get: [subStr, -4, -2] }, // 転居日（月）（出力編集仕様）
                { target: 'TNKYYMD', key: 'TNKYD', get: [subStr, -2] }, // 転居日（日）（出力編集仕様）
                'NENSY_JSY', // 年初住所
                'MNSYSEIRY_JISN_FLAG' // 番号確認書類持参フラグ
            ],
            // 電話番号
            tels: [
                'TELNO1', // 自宅電話番号１
                'TELNO2', // 自宅電話番号２
                'TELNO3', // 自宅電話番号３
                { target: 'TELNO_DEL', get: [getDefault, undefined] }, // 登録抹消（ご自宅電話番号）
                'MOBILE_TELNO1', // 携帯電話番号１
                'MOBILE_TELNO2', // 携帯電話番号２
                'MOBILE_TELNO3', // 携帯電話番号３
                { target: 'MOBILE_TELNO_DEL', get: [getDefault, undefined] }, // 登録抹消（携帯電話番号）
                'FAXNO1', // FAX番号１
                'FAXNO2', // FAX番号２
                'FAXNO3', // FAX番号３
                { target: 'FAXNO_DEL', get: [getDefault, undefined] }, // 登録抹消（FAX番号）
            ],
            // 日興MRF累積投資口座（証券総合口座取引）
            mrf: [
                { target: 'NIKKO_MRF', get: [getDefault, undefined] } // 日興MRF累積投資口座申込
            ],
            // 日興カード
            nkCard: [
                'NIKKO_CARD' // 日興カード申込区分
            ],
            // 日興イージートレード
            ezTrade: [
                'NIKKO_EZ' // 日興イージートレード申込区分
            ],
            // 外国証券取引口座
            gaikSyknKoza: [
                { target: 'GAIK_SYKN_KOZA', get: [getDefault, undefined] } // 外国証券取引口座申込
            ],
            // 特定口座
            tkKoza: [
                'TKTEI_KOZA_MSKM', // 特定口座申込区分
                'TKTEI_KOZA_AC', // 特定口座勘定区分
                'TKTEI_KOZA_GNSN', // 特定口座源徴区分
                'TKTEI_KOZA_YYK', // 特定口座変更予約
                'TKTEI_KOZA_NENSY_JSY' // 特定口座年初住所
            ],
            // 特定管理口座
            tkKanriKoza: [
                { target: 'TKTEI_KANRI_KOZA_MSKM', get: [getDefault, undefined] } // 特定管理口座申込
            ],
            // 加入者情報拡張登録
            kaNyu: [
                'KANYUSY_EXP_TORK_K' // 加入者情報拡張登録
            ],
            // NISA口座開設
            nisa: [
                'NISA_KOZA_MSKM', // NISA口座開設
                { target: 'HIREIHAIBUN', get: [getDefault, undefined] } // 株式数比例配分方式申込
            ],
            // 個人番号告知
            myNumber: [
                { target: 'MYNO_KOKUCHI', get: [getDefault, undefined] } // 個人番号告知
            ],
            // 当社から送金する際のお受取口座(削除分)はここ処理できなため、個別処理
            // 当社から送金する際のお受取口座(追加分)
            kozaAdd: [
                { target: 'KOZA', get: [getKozaAddArray] } // 振込先口座「0~2」
            ],
            // 利金・分配金支払方法（包括）
            suknHoukatsu: [
                'SUKN_HKT_AZKR', // 利金・分配金支払方法（包括）預り金入金
                'SUKN_HKT_TRKNO' // 利金・分配金支払方法（包括）登録銀行
            ],
            // 利金・分配金支払方法（銘柄）
            suknMeigara: [
                { target: 'SUKN_HKT_MEIG_K', get: [getDefault, undefined] } // 利金・分配金支払方法（銘柄）
            ],
            // 外国証券の円貨利金分配金振込銀行
            gaikSukn: [
                'GAIK_SYKN_YEN_SUKN_AZKR', // 外証の円貨利金分配金預り金入金
                'GAIK_SYKN_YEN_SUKN_BK' // 外証の円貨利金分配金振込銀行
            ],
            // 累投（株投型）分配金買付停止
            ruiTouSunk: [
                'RUITOU_SUKN_KAIT_TEIS_K', // 累投（株投型）分配金買付停止区分
                'RUITOU_SUKN_TRKNO' // 累投（株投型）分配金入金先変更
            ],
            // 配当金受領方式
            haitkinSunk: [
                'HAITKN_SYKN_UKTR_MSKM', // 配当金受領方式申込区分
                'AMEIG_FURIKOMI', // 配当金受領方式（全銘柄振込先指定方式）
                { target: 'AMEIG_FURIKOMI', key: 'AMEIG_FURIKOMI_CHK', get: [getAmeigFurikomiChk] } // 全銘柄振込先指定方式（出力編集仕様）
            ],
        };

        // 入力画面遷移制御フラグ（振込先口座削除フラグは個別処理 $scope.kozaDelを参照）
        var modifyFlgDefine = {
            modifyFlg: [
                'KYAKNM_F', // おなまえ変更フラグ
                'KYAK_ADDR_F', // ご住所変更フラグ
                'TELNO_F', // 電話番号変更フラグ
                'NIKKO_MRF_F', // 日興MRF変更フラグ
                'NIKKO_CARD_F', // 日興カード変更フラグ
                'NIKKO_EZ_F', // 日興EZ変更フラグ
                'GAIK_SYKN_KOZA_F', // 外国証券取引口座変更フラグ
                'TKTEI_KOZA_F', // 特定口座変更フラグ
                'TKTEI_KANRI_KOZA_F', // 特定管理口座変更フラグ
                'KANYUSY_EXP_F', // 加入者情報拡張登録変更フラグ
                'NISA_KOZA_F', // NISA口座開設フラグ
                'MYNO_KOKUCHI_F', // 個人番号告知フラグ
                'BK_KOZA_ADD_F', // 振込先銀行登録フラグ
                'YUCH_KOZA_ADD_F', // 振込先ゆうちょ登録フラグ
                'SUKN_HKT_F', // 利金・分配金支払方法（包括）変更フラグ
                'SUKN_HKT_MEIG_F', // 利金・分配金支払方法（銘柄）変更フラグ
                'GAIK_SYKN_YEN_F', // 外国証券の円貨利金分配金振込銀行変更フラグ
                'RUITOU_SUKN_KAIT_TEIS_F', // 累投（株投型）分配金買付停止変更フラグ
                'HAITKN_SYKN_UKTR_F' // 配当金受領方式変更フラグ
            ],
        };

        /**
         * エラーメッセージ・エラー赤枠を画面に表示する。
         * 
         * @param {string} targetid - 表示用エラー項目ID
         * @param {string} id - エラー項目ID（グループIDも含む）
         * @param {string} msg - エラーメッセージ
         * @param {string} msgID - エラーメッセージID
         */
        var showErrorMsg = function(targetid, id, msg, msgID){
            var target: any = $('#' + targetid);
            if(target){
                //エラーメッセージ表示場所(親element)取得
                var rowDiv: any = target.parents('.input-check-row');
                var nextEle: any = rowDiv.next();

                //エラーメッセージを表示
                var msgDom = '<span class=' + id + ' data-msgid="' + msgID + '">' + msg + '</span><br class=' + id + '>';
                if (nextEle.hasClass('err-message')) {
                    nextEle.html(nextEle.html() + msgDom);
                } else {
                    rowDiv.after('<div class="err-message">' + msgDom + '</div>');
                }
            }
        }

        /**
         * グループのエラー赤枠を画面に表示する。
         * 
         * @param {string} errorElementIds - エラー項目ID 「-」で連結する
         */
        var showGroupErrorItem = function (errorElementIds){
            errorElementIds.split('-').forEach(id => {
                //エラー項目取得
                var target: any = $('#' + id);
                if (target) {
                    //赤枠を表示
                    !target.hasClass('err') && target.addClass('err');
                    //エラーメッセージ表示場所(親element)取得
                    var rowDiv: any = target.parents('.input-check-row');
                    //ブロックに赤枠を表示
                    var container: any = rowDiv.parents('.input-check-area');
                    container && !container.hasClass('err') && container.addClass('err');
                }
            });
        };

        /**
         * グループのエラーメッセージ・エラー赤枠を画面に表示する。
         * 
         * @param {string} groupID - エラー項目ID 「-」で連結する
         * @param {string} msg - エラーメッセージ
         * @param {string} msgID - エラーメッセージID
         * @param {string} isShowOneMsgOnly - エラーメッセージ一回のみ表示する
         */
        var showErrorItemsGroup = function(groupID, msg, msgID, isShowOneMsgOnly){
            var ids = groupID.split('-');
            // メッセージ表示
            if (isShowOneMsgOnly){
                showErrorMsg(ids[0], groupID, msg, msgID);
            }
            ids.forEach(id => {
                 // メッセージ表示
                 !isShowOneMsgOnly && showErrorMsg(id, groupID, msg, msgID);
                //エラー項目取得
                var target: any = $('#' + id);
                if (target) {
                    //赤枠を表示
                    !target.hasClass('err') && target.addClass('err');

                    //エラーメッセージ表示場所(親element)取得
                    var rowDiv: any = target.parents('.input-check-row');        
                    //ブロックに赤枠を表示
                    var container: any = rowDiv.parents('.input-check-area');
                    container && !container.hasClass('err') && container.addClass('err');
                }
            });
        };

        /**
         * 相関チェックエラークリアする。
         * 
         * @param {string} groupId - エラー項目ID 「-」で連結する
         */
        var clearMulitiIdsError = function(groupId){
            clearErrorGroup(groupId);
            var ids = groupId.split('-');
            ids.forEach(id => {
                if (!checkExistError(id)) {
                    AppBizCom.Msg.clearError(id);
                }
            });
        };
        
        /**
         * エラーをクリアする。
         * 
         * @param {string} id - エラー項目ID
         */
        var clearErrorGroup = function(id){ 
            //エラー項目取得
            var target: any = $('#' + id);
            if (target == null || target == undefined) {
                return;
            }
            // 関連項目ID（赤枠をクリア用）
            var releavteIds = [];
            //エラーメッセージ表示場所(親element)取得
            var rowDiv: any = target.parents('.input-check-row');
            var nextEle: any = rowDiv.next();
            //エラーメッセージをクリア
            if (nextEle && nextEle.hasClass('err-message')) {
                var errTargets = $('[class*=' + id + ']');
                errTargets.toArray().forEach(err => {
                    err.className !== id && (releavteIds = releavteIds.concat(err.className.split('-').filter(e => e !== id)));
                    err.remove();
                });
                if($(nextEle).children().length == 0){
                    $(nextEle).remove();
                }
            }
            // 項目の赤枠をクリア
            target.removeClass('err');
            releavteIds.length > 0 && new Set(releavteIds).forEach((e1, e2)=> {
                !checkExistError(e2) && $('#' + e2).removeClass('err');
            });
            // 親ブロックの赤枠をクリア
            var areaDiv = target.parents('.input-check-area');
            areaDiv.find('.err').length == 0 && areaDiv.removeClass('err');
        };

        /**
         * エラーメッセージと類似文字リックを削除する。
         * 
         * @param {string} id - エラー項目ID
         */
        var clearSimlar = function (id) {
            // 類似文字リンクを削除
            var parent = $('#' + id+ 'Similar').parent();
            $('#' + id + 'Similar').remove();
            // 類似文字リンクの親Divに他の類似文字リンクがない場合、親Divも削除
            parent.children().length == 0 && parent.remove();
            // 親ブロックの赤枠をクリア
            var areaDiv = parent.parents('.input-check-area');
            areaDiv.find('.err').length == 0 && areaDiv.removeClass('err');
        };

        /**
         * 類似文字リンクがあれば、エラー赤枠を画面に表示する。
         * 
         * @param {string} ids - エラー項目ID 「-」で連結する
         */
        var showSimlarErrGroup = function(ids){
            ids.split('-').forEach(id => {
                //対象項目取得
                var target: any = $('#' + id);
                var similarTarget: any = $('#' + id + 'Similar');
                if (similarTarget.length != 0) {
                    //エラーメッセージ表示場所(親element)取得
                    var rowDiv: any = target.parents('.input-check-row');
                    //ブロックに赤枠を表示
                    var container: any = rowDiv.parents('.input-check-area');
                    if (container) {
                        container.addClass('err');
                    }
                }
            });
        };

        /**
         * エラーメッセージ表示とチェック返却値作成。
         * 
         * @param {string} isShowMsgOwn - メッセージ表示要フラグ
         * @param {string} id - エラー項目ID
         * @param {string} msgID - エラーメッセージID
         * @param {string} msgParams - エラーメッセージ用パラメータズ
         * @param {string} isShowOneMsgOnly - エラーメッセージ一回のみ表示する
         */
        var showMsgAndMakeChekResult = function(isShowMsgOwn, id, msgID, msgParams, isShowOneMsgOnly = true){
            var msg = AppBizCom.Msg.getMsg(msgID, msgParams);
            if (isShowMsgOwn) {
                // メッセージを表示する
                showErrorItemsGroup(id, msg, msgID, isShowOneMsgOnly);
            }
            return {errId: msgID, errMsg: msg, noMsgShow: isShowMsgOwn};
        };

        /**
         * 指定項目がエラーかどうかをチェックする。
         * 
         * @param {string} ids - エラー項目ID
         */
        var checkExistError = function(...ids) {
            return ids.some(id => $('[data-msgid]' + '.' + id).length > 0);
        };

        /**
         * グループ中の最大桁数チェック。
         * 
         * @param {string} ids - エラー項目ID 「-」で連結する
         * @param {string} maxLegth - 最大桁数
         * @param {string} isShowMsgOwn - メッセージ表示要フラグ
         * @param {string} msgID - エラーメッセージ用パラメータズ
         * @param {string} msgParams - エラーメッセージ用パラメータズ
         * @param {string} isShowOneMsgOnly - エラーメッセージ一回のみ表示する
         * @param {string} vals - エラーメッセージ用パラメータズ
         */
        var checkGroupMaxLength = function(ids ,maxLegth, isShowMsgOwn, msgID, msgParams, isShowOneMsgOnly, ...vals){         
            // 単項目チェックエラーの場合、チェックを行わない
            if (checkExistError.apply(null, ids.split('-'))) return undefined;

            // Check
            var isErr =  vals.reduce((totalLength, e) => angular.isString(e) ? totalLength + e.length : totalLength, 0) > maxLegth;

            if (isErr){
                return showMsgAndMakeChekResult(isShowMsgOwn, ids, msgID, msgParams, isShowOneMsgOnly);
            } else {
                return undefined;
            }
        };

        /**
         * 規定値チェックFromTo。
         * 
         * @param {string} ids - エラー項目ID
         * @param {string} from - 規定値From
         * @param {string} to - 規定値To
         * @param {string} isShowMsgOwn - メッセージ表示要フラグ
         * @param {string} msgParams - エラーメッセージ用パラメータズ
         * @param {string} val - 入力値
         */
        var checkValueFromTo = function(ids, from, to, isShowMsgOwn, msgParams, val){
            // Check
            var isErr = val ? (val < from || val > to) : false;

            if (isErr){
                return showMsgAndMakeChekResult(isShowMsgOwn, ids, 'KKAP-CM000-05E', msgParams);
            } else {
                return undefined;
            }
        };

        /**
         * 規定値チェックEqual。
         * 
         * @param {string} ids - エラー項目ID
         * @param {string} CompareVal - 比較用データ
         * @param {string} isShowMsgOwn - メッセージ表示要フラグ
         * @param {string} msgID - エラーメッセージ用パラメータズ
         * @param {string} msgParams - エラーメッセージ用パラメータズ
         * @param {string} val - 入力値
         */
        var checkValueEqual = function(ids, CompareVal, isShowMsgOwn, msgID, msgParams, val){
            // Check
            var isErr = val ? (val !== CompareVal) : false;

            if (isErr){
                return showMsgAndMakeChekResult(isShowMsgOwn, ids, msgID, msgParams);
            } else {
                return undefined;
            }
        };

        /**
         * 一括チェック結果オブジェクト更新する。
         * 
         * @param {string} target - エラー項目ID
         * @param {string} value - エラー項目ID
         * @param {string} msgId - エラー項目ID
         * @param {any} checkResult - チェック結果オブジェクト（falseの場合、処理をしない）
         */
        var checkResult1Update = function(target, value, msgId, checkResult) {
            if (checkResult) {
                var msgParam: any = checkResult[1];
                var tmp = msgParam[target];
                if (tmp instanceof Object && 'msgId' in tmp['chkResult']) {
                    msgParam[target]['chkResult']['msgId'].push(msgId);
                } else {
                    msgParam[target] = { chkErr: true, chkResult: {value: value, msgId: [msgId] }};
                }
                checkResult[1] = Object.assign(checkResult[1], msgParam);
            }
        };
     
        // ------------------------------------ ここから個別入力チェック START ------------------------------------ //

        // 各エリアの画面表示順定義（エラー項目モーダル画面用）
        var sortKeys = {
            name_sk: {sort: 1, name: 'おなまえ'},
            addr_sk: {sort: 2, name: 'ご住所'},
            tels_sk: {sort: 3, name: '電話番号'},
            mrf_sk: {sort: 4, name: '日興MRF累積投資口座（証券総合口座取引）'},
            nkCard_sk: {sort: 5, name: '日興カード'},
            ezTrade_sk: {sort: 6, name: '日興イージートレード'},
            gaikSyknKoza_sk: {sort: 7, name: '外国証券取引口座'},
            tkKoza_sk: {sort: 8, name: '特定口座'},
            tkKanriKoza_sk: {sort: 9, name: '特定管理口座'},
            kaNyu_sk: {sort: 10, name: '加入者情報拡張登録'},
            nisa_sk: {sort: 11, name: 'NISA口座開設'},
            myNumber_sk: {sort: 12, name: '個人番号告知'},
            kozaAdd_sk: {sort: 13, name: '当社から送金する際のお受取口座'},
            suknHoukatsu_sk: {sort: 14, name: '利金・分配金支払方法（包括）'},
            suknMeigara_sk: {sort: 15, name: '利金・分配金支払方法（銘柄）', specialName: '利金・分配金支払方法'},
            gaikSukn_sk: {sort: 16, name: '外国証券の円貨利金分配金振込銀行'},
            ruiTouSunk_sk: {sort: 17, name: '累投（株投型）分配金買付停止'},
            haitkinSunk_sk: {sort: 18, name: '配当金受領方式'},
        };

        // 全体チェック: 項目修正済みチェック
        var checkIsModified = function(checkResult) {
            var msgId = 'KKAP-SFJ06-31E';
            var target = 'TELNO_F';
            var value = $scope.modifyFlg[target];
            var tmpName = '電話番号';
            showErrorItemsGroup(
                target,
                AppBizCom.Msg.getMsg(msgId, [tmpName]),
                msgId,
                true,
            )
            checkResult1Update(target, value, msgId, checkResult);
            return true;
        };

        // 「おなまえ（漢字）姓入力」クリアエラー
        var clearNameSeiKanjiError = function (){ clearErrorGroup('txtKyaknmSeiKnj'); };
        // 「おなまえ（漢字）名入力」クリアエラー
        var clearNameMeiKanjiError = function (){ clearErrorGroup('txtKyaknmMeiKnj'); };
        // 「おなまえ（カナ）姓入力」クリアエラー
        var clearNameSeiKanaError = function (){ clearErrorGroup('txtKyaknmSeiKana'); };
        // 「おなまえ（カナ））名入力」クリアエラー
        var clearNameMeiKanaError = function (){ clearErrorGroup('txtKyaknmMeiKana'); };
        // おなまえ（漢字）姓、おなまえ（漢字）名の関連チェックエラーを示すフラグ
        var isPreCheckNameKanjiSeiMaxLegthError = false;
        // 関連チェックがエラー時、おなまえ（漢字）姓の変更フラグ（関連チェックチェックエラーがない時、類似文字リンク用）
        var isNameKanjiSeiChangeDuringMaxLengthCheck = false;
        // 関連チェックがエラー時、おなまえ（漢字）名の変更フラグ（関連チェックチェックエラーがない時、類似文字リンク用）
        var isNameKanjiMeiChangeDuringMaxLengthCheck = false;

        // おなまえチェック: 「おなまえ（漢字）姓入力」、おなまえ（漢字）名入力」を合せた桁数が20桁を超えた場合、エラー。（随時、一括）
        var checkNameKanjiMaxLength = function(){
            if (checkExistError('txtKyaknmSeiKnj', 'txtKyaknmMeiKnj')) {
                AppBizMsg.clearError('txtKyaknmSeiKnj-txtKyaknmMeiKnj');
                clearMulitiIdsError('txtKyaknmSeiKnj-txtKyaknmMeiKnj');
                return;
            }
            if (checkExistError('txtKyaknmSeiKnj-txtKyaknmMeiKnj')) {
                return;
            }
            return checkGroupMaxLength(
                'txtKyaknmSeiKnj-txtKyaknmMeiKnj', 
                20, 
                true, 
                'KKAP-SF014-01E', 
                [], 
                true, 
                $scope.name.KYAKNM_SEI_KNJ, 
                $scope.name.KYAKNM_MEI_KNJ
            );
        };

        // おなまえチェック: おなまえ（漢字）姓の関連チェック（随時）
        var checkNameKanjiSeiMaxLegth = function(){
            if (checkExistError(
                'txtKyaknmSeiKnj', 'txtKyaknmMeiKnj', 'txtKyaknmSeiKnj-txtKyaknmMeiKnj')) {
                return;
            }
            var res = checkNameKanjiMaxLength();

            // 相関チェックエラーの場合、他の項目の類似文字リンクを非表示する
            if (res && !isPreCheckNameKanjiSeiMaxLegthError) {
                isPreCheckNameKanjiSeiMaxLegthError = true;
                isNameKanjiSeiChangeDuringMaxLengthCheck = true;

                if ($('#txtKyaknmMeiKnjSimilar').length == 0){
                    isNameKanjiMeiChangeDuringMaxLengthCheck = false;
                } else {
                    clearSimlar('txtKyaknmMeiKnj');
                    isNameKanjiMeiChangeDuringMaxLengthCheck = true;
                }
            } else if (!res && isPreCheckNameKanjiSeiMaxLegthError) {
                // 相関チェックエラーがない場合、他の項目の類似文字リンクを表示する
                isNameKanjiMeiChangeDuringMaxLengthCheck && $scope.$broadcast('txtKyaknmMeiKnjAnyTimeChk', {type: 'valChangChk', isSimilarOnly: true});
                
                isPreCheckNameKanjiSeiMaxLegthError = false;
                isNameKanjiMeiChangeDuringMaxLengthCheck = false;
                isNameKanjiSeiChangeDuringMaxLengthCheck = false;
            } else if (res && isPreCheckNameKanjiSeiMaxLegthError) {
                if (!($('#txtKyaknmMeiKnjSimilar').length == 0)) {
                   clearSimlar('txtKyaknmMeiKnj');
                } 
            }
            return res;
        };

        // おなまえチェック: おなまえ（漢字）名の関連チェック（随時）
        var checkNameKanjiMeiMaxLegth = function(){
            if (checkExistError(
                'txtKyaknmSeiKnj', 'txtKyaknmMeiKnj', 'txtKyaknmSeiKnj-txtKyaknmMeiKnj')) {
                return;
            }
            var res = checkNameKanjiMaxLength();

            // 相関チェックエラーの場合、他の項目の類似文字リンクを非表示する
            if (res && !isPreCheckNameKanjiSeiMaxLegthError) {
                isPreCheckNameKanjiSeiMaxLegthError = true;
                isNameKanjiMeiChangeDuringMaxLengthCheck = true;

                if ($('#txtKyaknmSeiKnjSimilar').length == 0){
                    isNameKanjiSeiChangeDuringMaxLengthCheck = false;
                } else {
                    clearSimlar('txtKyaknmSeiKnj');
                    isNameKanjiSeiChangeDuringMaxLengthCheck = true;
                }
            } else if (!res && isPreCheckNameKanjiSeiMaxLegthError) {
                // 相関チェックエラーがない場合、他の項目の類似文字リンクを表示する
                isNameKanjiSeiChangeDuringMaxLengthCheck && $scope.$broadcast('txtKyaknmSeiKnjAnyTimeChk', {type: 'valChangChk', isSimilarOnly: true});
                isPreCheckNameKanjiSeiMaxLegthError = false;
                isNameKanjiSeiChangeDuringMaxLengthCheck = false;
                isNameKanjiMeiChangeDuringMaxLengthCheck = false;
            } else if (res && isPreCheckNameKanjiSeiMaxLegthError) {
                if (!($('#txtKyaknmSeiKnjSimilar').length == 0)) {
                   clearSimlar('txtKyaknmSeiKnj');
                } 
            }
            return res;
        };

        // おなまえチェック: 「おなまえ（カナ）姓入力」、「おなまえ（カナ）名入力」を半角へ変換して、変換半角カナを合せた桁数が29桁を超えた場合、エラー。（随時、一括）
        var checkNameKanaMaxLength = function(){
            return checkGroupMaxLength(
                'txtKyaknmSeiKana-txtKyaknmMeiKana', 
                29, 
                true, 
                'KKAP-CM000-19E',
                ['おなまえ（カナ）', '29'], 
                true, 
                AppCom.StringUtil.zenToHan($scope.name.KYAKNM_SEI_KANA, true), 
                AppCom.StringUtil.zenToHan($scope.name.KYAKNM_MEI_KANA, true)
            );
        };

        // 郵便番号関連チェックエラークリア
        var clearYubinNo1_Error = function(){ clearErrorGroup('txtAddrNum1'); };
        var clearYubinNo2_Error = function(){ clearErrorGroup('txtAddrNum2'); };
        // var clearYubinNo_Error = function(){ clearMulitiIdsError('txtAddrNum1-txtAddrNum2'); };

        // 住所関連チェックエラークリア
        // var clearAddr1_1Error = function(){ clearErrorGroup('txtAddr1_1'); };
        var clearAddr2_1Error = function(){ clearErrorGroup('txtAddr2_1'); };
        var clearAddr3_1Error = function(){ clearErrorGroup('txtAddr3_1'); };
        var clearAddr3_2Error = function(){ clearErrorGroup('txtAddr3_2'); };
        var clearAddr3_3Error = function(){ clearErrorGroup('txtAddr3_3'); };
        var clearlblAddr1_Error = function(){ clearErrorGroup('lblAddr1'); };
        var clearpldAddrTDFK_Error = function(){ clearErrorGroup('pldAddrTDFK'); };
        // ご住所③～ご住所③追加2の最大52文字の相関チェックエラークリア（漢字）
        var clearAddr3s_Error = function(){ clearErrorGroup('KYAK_ADDR3_F'); };
        // ご住所③～ご住所③追加2とご住所③カナ～ご住所③カナ追加2の相関チェックエラークリア（漢字）
        var clearAddr3s2_Error = function(){ clearErrorGroup('KYAK_ADDR3_F2'); };

        // 住所カナ関連チェックエラークリア
        // var clearAddrKana1_1Error = function(){ clearErrorGroup('txtAddrKana1_1'); };
        var clearAddrKana2_1Error = function(){ clearErrorGroup('txtAddrKana2_1'); };
        var clearAddrKana3_1Error = function(){ clearErrorGroup('txtAddrKana3_1'); };
        var clearAddrKana3_2Error = function(){ clearErrorGroup('txtAddrKana3_2'); };
        var clearAddrKana3_3Error = function(){ clearErrorGroup('txtAddrKana3_3'); };
        // ご住所③カナ～ご住所③カナ追加2の最大48文字（半角文字に変換後）の相関チェックエラークリア（カナ）
        var clearAddr3ks_Error = function(){ clearErrorGroup('KYAK_ADDR3_KANA_F'); };
        // ご住所③～ご住所③追加2とご住所③カナ～ご住所③カナ追加2の相関チェックエラークリア（カナ）
        var clearAddr3ks2_Error = function(){ clearErrorGroup('KYAK_ADDR3_KANA_F2'); };

        // ご住所①～ご住所③追加2の最大108文字の相関チェックエラークリア（漢字）
        var clearAddrs_Error = function() { clearErrorGroup('KYAK_ADDR_F'); };
        // ご住所①カナ～ご住所③カナ追加2の最大100文字（半角文字に変換後）の相関チェックエラークリア（カナ）
        var clearAddrks_Error = function() { clearErrorGroup('KYAK_ADDR_KANA_F'); };
        
        // 転居日関連チェックエラークリア
        var clearTnkyGengoError = function () { clearErrorGroup('pldTnkyGngo'); };
        var clearTnkyYearError = function () { clearErrorGroup('txtTnkyYear'); };
        var clearTnkyMonthError = function () { clearErrorGroup('txtTnkyMonth'); };
        var clearTnkyDayError = function () { clearErrorGroup('txtTnkyDay'); };
        var clearTnkyGengoYearError = function () { clearMulitiIdsError('pldTnkyGngo-txtTnkyYear'); };
        var clearTnkyError = function () { clearMulitiIdsError('pldTnkyGngo-txtTnkyYear-txtTnkyMonth-txtTnkyDay'); };
        var clearNensyJsyError = function () { clearErrorGroup('pldNensyJsy'); };

        var nensyJsyGloupErrorClear = function () {
            if (checkExistError('pldTkteiKozaNensy-pldNensyJsy')) {
                clearMulitiIdsError('pldTkteiKozaNensy-pldNensyJsy');
            }
            var tmpLen = $("#navCustomerTokuteiKoza .inputArea .err-message").length;
            var tmpErr = false;
            if (tmpLen == 0) {
                $("#navCustomerTokuteiKoza .inputArea").removeClass("err");
            } else {
                for (var i = 0; i < tmpLen; i++) {
                    if ($($("#navCustomerTokuteiKoza .inputArea .err-message")[i]).children().length != 0) {
                        tmpErr = true;
                    }
                }
                if (!tmpErr) {
                    $("#navCustomerTokuteiKoza .inputArea").removeClass("err");
                }
            }
            if (checkExistError('pldNensyJsy-pldTkteiKozaNensy')) {
                clearMulitiIdsError('pldNensyJsy-pldTkteiKozaNensy');
            }
            var tmpLen2 = $("#navCustomerAddress .inputArea .err-message").length;
            var tmpErr2 = false;
            if (tmpLen2 == 0) {
                $("#navCustomerAddress .inputArea").removeClass("err");
            } else {
                for (var i = 0; i < tmpLen2; i++) {
                    if ($($("#navCustomerAddress .inputArea .err-message")[i]).children().length != 0) {
                        tmpErr2 = true;
                    }
                }
                if (!tmpErr2) {
                    $("#navCustomerAddress .inputArea").removeClass("err");
                }
            }
            if ($("#navCustomerAddress .inputArea .err-message").length == 0) {
                $("#navCustomerAddress .inputArea").removeClass("err");
            }
        };

        // ご住所チェック: 住所不明チェック
        var checkIsUnknownAddr = function(checkResult) {
            if ($scope.isAddressUnkown || 
            (AppBizCom.InputCheck.isEmpty($scope.addrBefore.SOUHUSAKI_JYSY_KNJ) && 
            (!AppBizCom.InputCheck.isEmpty($scope.addrBefore.SOUHUSAKI_YBN_BNG) || 
            !AppBizCom.InputCheck.isEmpty($scope.addrBefore.SOUHUSAKI_JYSY_KN)))) {
                var msgId = 'KKAP-SFJ06-13E';
                var target = 'KYAK_ADDR_F_MAE';
                var value = $scope.modifyFlg[target];
                showErrorItemsGroup(
                    target,
                    AppBizCom.Msg.getMsg(msgId, []),
                    msgId,
                    true,
                )
                checkResult1Update(target, value, msgId, checkResult);
                return true;
            }
            return false;
        };

        // ご住所チェック: 郵便番号３桁がALL0（随時、一括）
        var checkYubinNo1AllZero = function(){
            var yubinNo1NotEmpty = !AppBizCom.InputCheck.isEmpty($scope.addr.YUBINNO_1);

            if (yubinNo1NotEmpty && ($scope.addr.YUBINNO_1 == '000')) {
                return { errId: 'KKAP-CM000-22E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-22E', ['郵便番号']) };
            } else {
                return undefined;
            }
        };

        // ご住所チェック: ご住所②入力桁数チェック（随時、一括）
        var checkAddr2MaxLength = function(){
            var maxLegth = $scope.addr.KYAK_ADDR_FLAG == '0' ? 12 : 10;
            return checkGroupMaxLength(
                'txtAddr2_1', 
                maxLegth, 
                false, 
                'KKAP-CM000-09E',
                ['ご住所②', maxLegth], 
                true, 
                $scope.addr.KYAK_HOSK_ADDR_KNJ, 
            );
        };

        // ご住所チェック: ご住所カナ項目の入力桁数チェック（汎用）
        var checkAddrKanaMaxLength = function(val, maxLength, msgParams){
            var halfKanaStr = AppCom.StringUtil.zenToHan(val, true);
            if (AppBizCom.InputCheck.chkMaxLength(String(halfKanaStr), maxLength) == 1) {
                return {errId: 'KKAP-CM000-19E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-19E', msgParams)};
            }
            return undefined;
        };

        // ご住所チェック: ご住所②カナ項目の入力桁数チェック（随時、一括）
        var checkAddrKana2MaxLength = function(){
            return checkAddrKanaMaxLength($scope.addr.KYAK_HOSK_ADDR_KANA, 18, ['ご住所②のフリガナ', '18']);
        };

        // ご住所チェック: ご住所③カナ項目の入力桁数チェック（随時、一括）
        var checkAddrKana3_1MaxLength = function(){
            return checkAddrKanaMaxLength($scope.addr.KYAK_HOUSENM_KANAS[0], 18, ['ご住所③のフリガナ', '18']);
        };

        // ご住所チェック: ご住所③カナ追加1項目の入力桁数チェック（随時、一括）
        var checkAddrKana3_2MaxLength = function(){
            return checkAddrKanaMaxLength($scope.addr.KYAK_HOUSENM_KANAS[1], 30, ['ご住所③のフリガナ', '30']);
        };

        // ご住所チェック: ご住所③カナ追加2項目の入力桁数チェック（随時、一括）
        var checkAddrKana3_3MaxLength = function(){
            return checkAddrKanaMaxLength($scope.addr.KYAK_HOUSENM_KANAS[2], 30, ['ご住所③のフリガナ', '30']);
        };

        // ご住所チェック: 住所検索の場合、「郵便番号検索結果住所」の単項目チェック（必須チェック）（一括）
        var checklblAddr1IsEmpty = function(checkResult){
            if ($scope.addr.KYAK_ADDR_FLAG == '0' && AppBizCom.InputCheck.isEmpty($scope.addr.KYAK_ADDR_KNJ)) {
                var msgId = 'KKAP-CM000-21E';
                var target = 'KYAK_ADDR_KNJ';
                var value = $scope.addr[target];
                showErrorItemsGroup(
                    'lblAddr1',
                    AppBizCom.Msg.getMsg(msgId, ['住所', 'ご住所']),
                    msgId,
                    true
                )
                checkResult1Update(target, value, msgId, checkResult);
                return true;
            } else {
                return false;
            }
        };

        // ご住所チェック: ご住所③～ご住所③追加2の最大52文字の相関チェック（随時、一括）
        var checkAddr3MaxLength = function(checkResult) {
            clearAddr3s_Error();
            if (!checkExistError('txtAddr3_1') && !checkExistError('KYAK_ADDR_F') && !checkExistError('KYAK_ADDR_F2')) {
                clearAddr3_1Error();
            }
            if (!checkExistError('txtAddr3_2') && !checkExistError('KYAK_ADDR_F') && !checkExistError('KYAK_ADDR_F2')) {
                clearAddr3_2Error();
            }
            if (!checkExistError('txtAddr3_3') && !checkExistError('KYAK_ADDR_F') && !checkExistError('KYAK_ADDR_F2')) {
                clearAddr3_3Error();
            }
            var addr3Vals = [
                $scope.addr.KYAK_HOUSENM_KNJS[0],
                $scope.addr.KYAK_HOUSENM_KNJS[1],
                $scope.addr.KYAK_HOUSENM_KNJS[2]
            ];
            var isErrAddr3Vals = addr3Vals.reduce((totalLength, e) => angular.isString(e) ? totalLength + e.length : totalLength, 0) > 52;
            if (!checkExistError('txtAddr3_1', 'txtAddr3_2', 'txtAddr3_3') && isErrAddr3Vals){
                var msgId = 'KKAP-CM000-09E';
                var param = ['ご住所③', '52'];
                var value = addr3Vals.join('');
                var target = 'KYAK_ADDR3_F';
                showErrorItemsGroup(
                    target,
                    AppBizCom.Msg.getMsg(msgId, param),
                    msgId,
                    true
                );
                showGroupErrorItem('txtAddr3_1-txtAddr3_2-txtAddr3_3');
                checkResult1Update(target, value, msgId, checkResult);
                return true;
            } else {
                return false;
            }
        };

        // ご住所チェック: ご住所③カナ～ご住所③カナ追加2の最大48文字（半角文字に変換後）の相関チェック（随時、一括）
        var checkAddrKana3MaxLength = function(checkResult){
            clearAddr3ks_Error();
            if (!checkExistError('txtAddrKana3_1') && !checkExistError('KYAK_ADDR_KANA_F') && !checkExistError('KYAK_ADDR_KANA_F2')) {
                clearAddrKana3_1Error();
            }
            if (!checkExistError('txtAddrKana3_2') && !checkExistError('KYAK_ADDR_KANA_F') && !checkExistError('KYAK_ADDR_KANA_F2')) {
                clearAddrKana3_2Error();
            }
            if (!checkExistError('txtAddrKana3_3') && !checkExistError('KYAK_ADDR_KANA_F') && !checkExistError('KYAK_ADDR_KANA_F2')) {
                clearAddrKana3_3Error();
            }
            var addr3KanaVals = [
                AppCom.StringUtil.zenToHan($scope.addr.KYAK_HOUSENM_KANAS[0], true),
                AppCom.StringUtil.zenToHan($scope.addr.KYAK_HOUSENM_KANAS[1], true),
                AppCom.StringUtil.zenToHan($scope.addr.KYAK_HOUSENM_KANAS[2], true)
            ];
            var isErrAddr3KanaVals = addr3KanaVals.reduce((totalLength, e) => angular.isString(e) ? totalLength + e.length : totalLength, 0) > 48;
            if (!checkExistError('txtAddrKana3_1', 'txtAddrKana3_2', 'txtAddrKana3_3') && isErrAddr3KanaVals){
                var msgId = 'KKAP-CM000-19E';
                var param = ['ご住所③のフリガナ', '48'];
                var value = addr3KanaVals.join('');
                var target = 'KYAK_ADDR3_KANA_F';
                showErrorItemsGroup(
                    target,
                    AppBizCom.Msg.getMsg(msgId, param),
                    msgId,
                    true
                );
                showGroupErrorItem('txtAddrKana3_1-txtAddrKana3_2-txtAddrKana3_3');
                checkResult1Update(target, value, msgId, checkResult);
                return true;
            } else {
                return false;
            }
        };

        // ご住所チェック: ご住所①～ご住所③追加2の最大108文字の相関チェック（随時、一括）
        var checkAddrsMaxLength = function(checkResult) {
            clearAddrs_Error();
            if (!checkExistError('KYAK_ADDR_KANA_F') && !checkExistError('pldAddrTDFK')) {
                clearpldAddrTDFK_Error();
            }
            if (!checkExistError('lblAddr1')) {
                clearlblAddr1_Error();
            }
            if (!checkExistError('txtAddr2_1')) {
                clearAddr2_1Error();
            }
            if (!checkExistError('txtAddr3_1') && !checkExistError('KYAK_ADDR3_F') && !checkExistError('KYAK_ADDR3_F2')) {
                clearAddr3_1Error();
            }
            if (!checkExistError('txtAddr3_2') && !checkExistError('KYAK_ADDR3_F') && !checkExistError('KYAK_ADDR3_F2')) {
                clearAddr3_2Error();
            }
            if (!checkExistError('txtAddr3_3') && !checkExistError('KYAK_ADDR3_F') && !checkExistError('KYAK_ADDR3_F2')) {
                clearAddr3_3Error();
            }
            var addrVals = [
                $scope.addr.KYAK_ADDR_FLAG == '1' ? getFromCodeList($scope.addr.KYAK_ADDR_TDHKN, $scope.tDFKList, '', 'MSY', 'CD') : $scope.addr.KYAK_ADDR_KNJ,
                $scope.addr.KYAK_HOSK_ADDR_KNJ,
                $scope.addr.KYAK_HOUSENM_KNJS[0],
                $scope.addr.KYAK_HOUSENM_KNJS[1],
                $scope.addr.KYAK_HOUSENM_KNJS[2]
            ];
            var isErrAddrVals = addrVals.reduce((totalLength, e) => angular.isString(e) ? totalLength + e.length : totalLength, 0) > 108;
            if (!checkExistError('pldAddrTDFK', 'lblAddr1', 'txtAddr2_1', 'txtAddr3_1', 'txtAddr3_2', 'txtAddr3_3') && isErrAddrVals){
                var msgId = 'KKAP-SF014-16E';
                var param = ($scope.addr.KYAK_ADDR_FLAG == '0') ? ['ご住所①', 'ご住所③'] : ['ご住所①（都道府県）', 'ご住所③'];
                var value = addrVals.join('');
                var target = 'KYAK_ADDR_F';
                showErrorItemsGroup(
                    target,
                    AppBizCom.Msg.getMsg(msgId, param),
                    msgId,
                    true
                );
                showGroupErrorItem('pldAddrTDFK-lblAddr1-txtAddr2_1-txtAddr3_1-txtAddr3_2-txtAddr3_3');
                checkResult1Update(target, value, msgId, checkResult);
                return true;
            } else {
                return false;
            }
        };

        // ご住所チェック: ご住所①カナ～ご住所③カナ追加2の最大100文字（半角文字に変換後）の相関チェック（随時、一括）
        var checkAddrKanasMaxLength = function(checkResult) {
            clearAddrks_Error();
            if (!checkExistError('KYAK_ADDR_F') && !checkExistError('pldAddrTDFK')) {
                clearpldAddrTDFK_Error();
            }
            if (!checkExistError('txtAddrKana2_1')) {
                clearAddrKana2_1Error();
            }
            if (!checkExistError('txtAddrKana3_1') && !checkExistError('KYAK_ADDR3_KANA_F') && !checkExistError('KYAK_ADDR3_KANA_F2')) {
                clearAddrKana3_1Error();
            }
            if (!checkExistError('txtAddrKana3_2') && !checkExistError('KYAK_ADDR3_KANA_F') && !checkExistError('KYAK_ADDR3_KANA_F2')) {
                clearAddrKana3_2Error();
            }
            if (!checkExistError('txtAddrKana3_3') && !checkExistError('KYAK_ADDR3_KANA_F') && !checkExistError('KYAK_ADDR3_KANA_F2')) {
                clearAddrKana3_3Error();
            }
            var addrKanaVals = [
                AppCom.StringUtil.zenToHan($scope.addr.KYAK_ADDR_FLAG == '1' ? getFromCodeList($scope.addr.KYAK_ADDR_TDHKN, $scope.tDFKList, '', 'STM1', 'CD') : $scope.addr.KYAK_ADDR_KANA, true),
                AppCom.StringUtil.zenToHan($scope.addr.KYAK_HOSK_ADDR_KANA, true),
                AppCom.StringUtil.zenToHan($scope.addr.KYAK_HOUSENM_KANAS[0], true),
                AppCom.StringUtil.zenToHan($scope.addr.KYAK_HOUSENM_KANAS[1], true),
                AppCom.StringUtil.zenToHan($scope.addr.KYAK_HOUSENM_KANAS[2], true)
            ];
            var isErrAddrKanaVals =  addrKanaVals.reduce((totalLength, e) => angular.isString(e) ? totalLength + e.length : totalLength, 0) > 100;
            if (!checkExistError('pldAddrTDFK', 'txtAddrKana2_1', 'txtAddrKana3_1', 'txtAddrKana3_2', 'txtAddrKana3_3') && isErrAddrKanaVals){
                var msgId = 'KKAP-SF014-18E';
                var param = ($scope.addr.KYAK_ADDR_FLAG == '0') ? ['ご住所①', 'ご住所③'] : ['ご住所①（都道府県）', 'ご住所③'];
                var value = addrKanaVals.join('');
                var target = 'KYAK_ADDR_KANA_F';
                showErrorItemsGroup(
                    target,
                    AppBizCom.Msg.getMsg(msgId, param),
                    msgId,
                    true
                );
                showGroupErrorItem('pldAddrTDFK-txtAddrKana2_1-txtAddrKana3_1-txtAddrKana3_2-txtAddrKana3_3');
                checkResult1Update(target, value, msgId, checkResult);
                return true;
            } else {
                return false;
            }
        };

        // ご住所チェック: ご住所③～ご住所③追加2とご住所③カナ～ご住所③カナ追加2の相関チェック（随時、一括）
        var checkAddr3AndKana3 = function (checkResult){
            clearAddr3ks2_Error();
            if (!checkExistError('txtAddrKana3_1') && !checkExistError('KYAK_ADDR_KANA_F') && !checkExistError('KYAK_ADDR3_KANA_F')) {
                clearAddrKana3_1Error();
            }
            if (!checkExistError('txtAddrKana3_2') && !checkExistError('KYAK_ADDR_KANA_F') && !checkExistError('KYAK_ADDR3_KANA_F')) {
                clearAddrKana3_2Error();
            }
            if (!checkExistError('txtAddrKana3_3') && !checkExistError('KYAK_ADDR_KANA_F') && !checkExistError('KYAK_ADDR3_KANA_F')) {
                clearAddrKana3_3Error();
            }
            clearAddr3s2_Error();
            if (!checkExistError('txtAddr3_1') && !checkExistError('KYAK_ADDR_F') && !checkExistError('KYAK_ADDR3_F')) {
                clearAddr3_1Error();
            }
            if (!checkExistError('txtAddr3_2') && !checkExistError('KYAK_ADDR_F') && !checkExistError('KYAK_ADDR3_F')) {
                clearAddr3_2Error();
            }
            if (!checkExistError('txtAddr3_3') && !checkExistError('KYAK_ADDR_F') && !checkExistError('KYAK_ADDR3_F')) {
                clearAddr3_3Error();
            }
            var addr3_1 = AppBizCom.InputCheck.isEmpty($scope.addr.KYAK_HOUSENM_KNJS[0]);
            var addr3_2 = AppBizCom.InputCheck.isEmpty($scope.addr.KYAK_HOUSENM_KNJS[1]);
            var addr3_3 = AppBizCom.InputCheck.isEmpty($scope.addr.KYAK_HOUSENM_KNJS[2]);
            var addrKana3_1 = AppBizCom.InputCheck.isEmpty($scope.addr.KYAK_HOUSENM_KANAS[0]);
            var addrKana3_2 = AppBizCom.InputCheck.isEmpty($scope.addr.KYAK_HOUSENM_KANAS[1]);
            var addrKana3_3 = AppBizCom.InputCheck.isEmpty($scope.addr.KYAK_HOUSENM_KANAS[2]);

            if (!checkExistError('txtAddr3_1', 'txtAddr3_2', 'txtAddr3_3', 'txtAddrKana3_1', 'txtAddrKana3_2', 'txtAddrKana3_3')){
                var errFlg = false;
                //　ご住所③のフリガナ-1､ご住所③のフリガナ-2､ご住所③のフリガナ-3の何れかが入力され､ご住所③-1､ご住所③-2､ご住所③-3が何れも入力されていない場合エラー。
                if ((addr3_1 && addr3_2 && addr3_3) && (!addrKana3_1 || !addrKana3_2 || !addrKana3_3)) {
                    var msgId = 'KKAP-CM000-01E';
                    var param = ['ご住所③'];
                    var value = [$scope.addr.KYAK_HOUSENM_KNJS[0], $scope.addr.KYAK_HOUSENM_KNJS[1], $scope.addr.KYAK_HOUSENM_KNJS[2]].join('');
                    var target = 'KYAK_ADDR3_F2';
                    showErrorItemsGroup(
                        target,
                        AppBizCom.Msg.getMsg(msgId, param),
                        msgId,
                        true
                    );
                    showGroupErrorItem('txtAddr3_1-txtAddr3_2-txtAddr3_3');
                    checkResult1Update(target, value, msgId, checkResult);
                    errFlg = true;
                }
                // ご住所③-1､ご住所③-2､ご住所③-3の何れかが入力され､ご住所③のフリガナ-1､ご住所③のフリガナ-2､ご住所③のフリガナ-3が何れも入力されていない場合エラー。
                if ((addrKana3_1 && addrKana3_2 && addrKana3_3) && (!addr3_1 || !addr3_2 || !addr3_3)) {
                    var msgId = 'KKAP-CM000-01E';
                    var param = ['ご住所③のフリガナ'];
                    var value = [$scope.addr.KYAK_HOUSENM_KANAS[0], $scope.addr.KYAK_HOUSENM_KANAS[1], $scope.addr.KYAK_HOUSENM_KANAS[2]].join('');
                    var target = 'KYAK_ADDR3_KANA_F2';
                    showErrorItemsGroup(
                        target,
                        AppBizCom.Msg.getMsg(msgId, param),
                        msgId,
                        true
                    );
                    showGroupErrorItem('txtAddrKana3_1-txtAddrKana3_2-txtAddrKana3_3');
                    checkResult1Update(target, value, msgId, checkResult);
                    errFlg = true;
                }
                if (errFlg) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        };

        // ご住所チェック: 転居日、年初住所項目の必須チェック（一括汎用）
        var checkTnkyIsEmpty = function(item, msgParams, isSelect = false){
            var errFlg = AppBizCom.InputCheck.isEmpty($scope.addr[item]);
            var msgId = isSelect ? 'KKAP-CM000-02E' : 'KKAP-CM000-01E';
            // 条件①：既契約情報の特定口座源徴区分（源徴あり）
            // 条件②：変更するの特定口座源徴区分（源徴あり）
            if ($scope.tkKozaBefore.TKTEI_KOZA_GNSN == '1' && errFlg){
                return {errId: msgId, errMsg: AppBizCom.Msg.getMsg(msgId, msgParams)};
            } else {
                return undefined;
            }
        };

        // ご住所チェック: 転居日（元号）の必須チェック（一括）
        var checkTnkyGengoIsEmpty = function(){
            return checkTnkyIsEmpty('TNKY_GNGO', ['転居日（元号）'], true);
        };

        // ご住所チェック: 転居日（年）の必須チェック（一括）
        var checkTnkyYearIsEmpty = function(){
            return checkTnkyIsEmpty('TNKYY', ['転居日（年）']);
        };

        // ご住所チェック: 転居日（月）の必須チェック（一括）
        var checkTnkyMonthIsEmpty = function(){
            return checkTnkyIsEmpty('TNKYM', ['転居日（月）']);
        };

        // ご住所チェック: 転居日（日）の必須チェック（一括）
        var checkTnkyDayIsEmpty = function(){
            return checkTnkyIsEmpty('TNKYD', ['転居日（日）']);
        };

        // ご住所チェック: 年初住所（ご住所）の必須チェック（一括）
        var checkTnkyNensyIsEmpty = function(){
            return checkTnkyIsEmpty('NENSY_JSY', ['年初住所'], true);
        };

        // ご住所チェック: 転居日（元号）、転居日入力(年)相関チェック（随時、一括）
        var checkTnkyGengoYear = function(){
            var ids = 'pldTnkyGngo-txtTnkyYear';

            // 転居日（元号）が西暦以外を選択時に転居日（年）が3桁以上で入力されている場合、エラー。
            if ($scope.addr.TNKY_GNGO && $scope.addr.TNKY_GNGO != tnkyGngoAD && $scope.addr.TNKYY && $scope.addr.TNKYY.length > 2){
                return showMsgAndMakeChekResult(true, ids, 'KKAP-CM000-09E', ['転居日（年）', '2']);
            } else if ($scope.addr.TNKY_GNGO && $scope.addr.TNKY_GNGO == tnkyGngoAD && $scope.addr.TNKYY && $scope.addr.TNKYY.length < 4){
                //  転居日（元号）が西暦を選択時に転居日（年）が4桁未満で入力された場合エラー。
                return showMsgAndMakeChekResult(true, ids, 'KKAP-CM000-04E', ['転居日（年）', '4']);
            } else if ($scope.addr.TNKY_GNGO == 6 && $scope.addr.TNKYY && Number($scope.addr.TNKYY) < 1900) {
                // 転居日（年）が1900年未満の場合、エラー
                return showMsgAndMakeChekResult(true, ids, 'KKAP-CM000-03E', ['転居日（年）', '1900年以降']);
            } else {
                return undefined;
            }
        };

        // ご住所チェック: 転居日（元号）、転居日入力(年)、転居日入力(月)、転居日入力(日)の相関チェック（随時）
        var checkTnykGengoYearMonthDay = function(){
            
            // 転居日（元号）、転居日（年）、転居日（月）、転居日（日）全て入力されている
            // かつ転居日（元号）、転居日（年）、転居日（月）、転居日（日）にエラーがない場合、チェックを行う
            if (!$scope.addr.TNKY_GNGO || !$scope.addr.TNKYY || !$scope.addr.TNKYM || !$scope.addr.TNKYD){
                return undefined;
            }

            if (checkExistError('pldTnkyGngo', 'txtTnkyYear', 'txtTnkyMonth', 'txtTnkyDay', 'pldTnkyGngo-txtTnkyYear')){
                return undefined;
            }

            var ids = 'pldTnkyGngo-txtTnkyYear-txtTnkyMonth-txtTnkyDay';

            // 転居日（元号）＋転居日（年）＋転居日（月）＋転居日（日）が存在しない日付の場合、エラー
            if (!AppBizCom.InputCheck.isDate($scope.addr.TNKY_GNGO, $scope.addr.TNKYY, $scope.addr.TNKYM, $scope.addr.TNKYD)){
                return showMsgAndMakeChekResult(true, ids, 'KKAP-SF014-03E', ['転居日']);
            } else {
                // 転居日（元号）＋転居日（年）＋転居日（月）＋転居日（日）が未来日付場合、エラー
                // 和暦の場合、西暦へ変更
                var tnkyYMD = $scope.addr.TNKY_GNGO == tnkyGngoAD ? 
                    $scope.addr.TNKYY + '-' + ("00" + $scope.addr.TNKYM).substr(-2) + '-' + ("00" + $scope.addr.TNKYD).substr(-2) : 
                    AppCom.Date.convertDate($scope.addr.TNKY_GNGO, $scope.addr.TNKYY, $scope.addr.TNKYM, $scope.addr.TNKYD);
                
                return new Date(tnkyYMD) <= new Date(gyomuDate) ? undefined : showMsgAndMakeChekResult(true, ids, 'KKAP-SF014-04E', ['転居日']);
            }
        };

        // ご住所チェック: 転居日入力(月) 規定値チェックエラー（随時）
        var checkTnykMonthFromTo = function(){
            return checkValueFromTo('txtTnkyMonth', 1, 12, false, ['転居日（月）', '1', '12'], $scope.addr.TNKYM);
        };

        // ご住所チェック: 転居日入力(日) 規定値チェックエラー（随時）
        var checkTnykDayFromTo = function(){
            return checkValueFromTo('txtTnkyDay', 1, 31, false, ['転居日（日）', '1', '31'], $scope.addr.TNKYD);
        };

        // ご住所チェック: 転居日（元号）、転居日入力(年)、転居日入力(月)、転居日入力(日)の相関チェック（一括）
        var checkTnykDate = function(checkResult){
            // 転居日（元号）、転居日（年）、転居日（月）、転居日（日）全て入力されている
            // かつ転居日（元号）、転居日（年）、転居日（月）、転居日（日）にエラーがない場合、チェックを行う
            if (!$scope.addr.TNKY_GNGO || !$scope.addr.TNKYY || !$scope.addr.TNKYM || !$scope.addr.TNKYD){
                return false;
            }

            if (checkExistError('pldTnkyGngo', 'txtTnkyYear', 'txtTnkyMonth', 'txtTnkyDay', 'pldTnkyGngo-txtTnkyYear')){
                return false;
            }

            var ids = 'pldTnkyGngo-txtTnkyYear-txtTnkyMonth-txtTnkyDay';

            // 転居日（元号）＋転居日（年）＋転居日（月）＋転居日（日）が存在しない日付の場合、エラー
            if (!AppBizCom.InputCheck.isDate($scope.addr.TNKY_GNGO, $scope.addr.TNKYY, $scope.addr.TNKYM, $scope.addr.TNKYD)){
                var msgId = 'KKAP-SF014-03E';
                var target = 'TNKYD';
                var value = $scope.addr[target];
                showErrorItemsGroup(
                    ids,
                    AppBizCom.Msg.getMsg(msgId, ['転居日']),
                    msgId,
                    true
                )
                checkResult1Update(target, value, msgId, checkResult);
                return true;
            } 
            
            // 転居日（元号）＋転居日（年）＋転居日（月）＋転居日（日）が未来日付場合、エラー
            // 和暦の場合、西暦へ変更
            var tnkyYMD = $scope.addr.TNKY_GNGO == tnkyGngoAD ? 
                $scope.addr.TNKYY + '-' + ("00" + $scope.addr.TNKYM).substr(-2) + '-' + ("00" + $scope.addr.TNKYD).substr(-2) : 
                AppCom.Date.convertDate($scope.addr.TNKY_GNGO, $scope.addr.TNKYY, $scope.addr.TNKYM, $scope.addr.TNKYD);
            if (new Date(tnkyYMD) <= new Date(gyomuDate)){
                return false;
            } else {
                var msgId = 'KKAP-SF014-04E';
                var target = 'TNKYD';
                var value = $scope.addr[target];
                showErrorItemsGroup(
                    ids,
                    AppBizCom.Msg.getMsg(msgId, ['転居日']),
                    msgId,
                    true
                )
                checkResult1Update(target, value, msgId, checkResult);
                return true;
            }
        };        

        // ご住所チェック: 年初住所（ご住所）と年初住所（特定口座）の相関チェック（一括）
        var checkNensyIsSame = function(checkResult){
            if (checkExistError('pldNensyJsy', 'pldTkteiKozaNensy') || checkExistError('radioTkKoza')) {
                return false;
            }
            // 特定口座年初住所と一致しない場合エラー。 ※ 特定口座申込が行われ年初住所が選択されている場合のみ
            var tkKozaErrFlg = AppBizCom.InputCheck.isEmpty($scope.tkKoza.TKTEI_KOZA_NENSY_JSY);
            var addrErrFlg = AppBizCom.InputCheck.isEmpty($scope.addr.NENSY_JSY);
            if (!tkKozaErrFlg && !addrErrFlg && ($scope.tkKoza.TKTEI_KOZA_NENSY_JSY != $scope.addr.NENSY_JSY)){
                var msgId = 'KKAP-SFJ06-07E';
                var param = [];
                var target1 = 'NENSY_JSY';
                var target2 = 'TKTEI_KOZA_NENSY_JSY';
                var value1 = $scope.addr.NENSY_JSY;
                var value2 = $scope.tkKoza.TKTEI_KOZA_NENSY_JSY;
                showErrorItemsGroup(
                    'pldNensyJsy-pldTkteiKozaNensy',
                    AppBizCom.Msg.getMsg(msgId, param),
                    msgId,
                    true
                );
                showErrorItemsGroup(
                    'pldTkteiKozaNensy-pldNensyJsy',
                    AppBizCom.Msg.getMsg(msgId, param),
                    msgId,
                    true
                );
                if (checkResult) {
                    checkResult1Update(target1, value1, msgId, checkResult);
                    checkResult[2].push(sortKeys.addr_sk);
                    checkResult1Update(target2, value2, msgId, checkResult);
                    checkResult[2].push(sortKeys.tkKoza_sk);
                }
                return true;
            }
            return false;
        };

        // 「ご自宅電話番号１」～「ご自宅電話番号３」関連チェックエラーメッセージクリア
        var clearTelGroupError = function(isAnytimeCheck = true){
            var tmpErr = $(".txtTelno1-txtTelno2-txtTelno3[data-msgid]").attr("data-msgid") === 'KKAP-SFJ06-10E';
            if (isAnytimeCheck || !checkExistError('txtTelno1-txtTelno2-txtTelno3')) {
                clearMulitiIdsError('txtTelno1-txtTelno2-txtTelno3');
            }
            // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
            if (!checkExistError('txtTelno1-txtTelno2')) {
                clearMulitiIdsError('txtTelno1-txtTelno2');
            }
            // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913
            if (!checkExistError('txtMobileTelno1-txtMobileTelno2-txtMobileTelno3')) {
                clearMulitiIdsError('txtMobileTelno1-txtMobileTelno2-txtMobileTelno3');
            }
            if (!checkExistError('txtFaxno1-txtFaxno2-txtFaxno3')) {
                clearMulitiIdsError('txtFaxno1-txtFaxno2-txtFaxno3');
            }
            clearErrorGroup('txtTelno1-txtTelno2-txtTelno3');
            // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
            clearErrorGroup('txtTelno1-txtTelno2');
            // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913
            clearErrorGroup('txtTel-txtMobile-txtFax');
            clearErrorGroup('txtTel-txtMobile');
            tmpErr && checkTelGroupMxlnAndSameOfOld('txtTelno1-txtTelno2-txtTelno3', 'TELNO', ['ご自宅電話番号', '10'], 10, false, true);
        };

        // 「携帯電話番号１」～「携帯電話番号３」関連チェックエラーメッセージクリア
        var clearMobileGroupError = function(isAnytimeCheck = true){
            var tmpErr = $(".txtMobileTelno1-txtMobileTelno2-txtMobileTelno3[data-msgid]").attr("data-msgid") === 'KKAP-SFJ06-10E';
            if (!checkExistError('txtTelno1-txtTelno2-txtTelno3')) {
                clearMulitiIdsError('txtTelno1-txtTelno2-txtTelno3');
            }
            if (isAnytimeCheck || !checkExistError('txtMobileTelno1-txtMobileTelno2-txtMobileTelno3')) {
                clearMulitiIdsError('txtMobileTelno1-txtMobileTelno2-txtMobileTelno3');
            }
            if (!checkExistError('txtFaxno1-txtFaxno2-txtFaxno3')) {
                clearMulitiIdsError('txtFaxno1-txtFaxno2-txtFaxno3');
            }
            clearErrorGroup('txtTel-txtMobile-txtFax');
            clearErrorGroup('txtTel-txtMobile');
            tmpErr && checkTelGroupMxlnAndSameOfOld('txtMobileTelno1-txtMobileTelno2-txtMobileTelno3', 'MOBILE_TELNO', ['携帯電話番号'], undefined, false, true);
        };

        // 「FAX番号１」～「FAX番号３」関連チェックエラーメッセージクリア
        var clearFaxGroupError = function(isAnytimeCheck = true){
            var tmpErr = $(".txtFaxno1-txtFaxno2-txtFaxno3[data-msgid]").attr("data-msgid") === 'KKAP-SFJ06-10E';
            if (!checkExistError('txtTel-txtMobile')) {
                if (!checkExistError('txtTelno1-txtTelno2-txtTelno3')) {
                    clearMulitiIdsError('txtTelno1-txtTelno2-txtTelno3');
                }
                if (!checkExistError('txtMobileTelno1-txtMobileTelno2-txtMobileTelno3')) {
                    clearMulitiIdsError('txtMobileTelno1-txtMobileTelno2-txtMobileTelno3');
                }
            }
            if (isAnytimeCheck || !checkExistError('txtFaxno1-txtFaxno2-txtFaxno3')) {
                clearMulitiIdsError('txtFaxno1-txtFaxno2-txtFaxno3');
            }
            // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
            if (!checkExistError('txtFaxno1-txtFaxno2')) {
                clearMulitiIdsError('txtFaxno1-txtFaxno2');
            }
            // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913
            clearErrorGroup('txtTel-txtMobile-txtFax');
            // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
            clearErrorGroup('txtFaxno1-txtFaxno2');
            // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913
            tmpErr && checkTelGroupMxlnAndSameOfOld('txtFaxno1-txtFaxno2-txtFaxno3', 'FAXNO', ['FAX番号', '10'], 10, false, true);
        };

        // 電話番号チェック: 各電話番号1～3の相関チェック（一括汎用）
        var checkTelIsInGroup = function(id, target, param, chkGroup){
            var tels = {
                TELNO1: AppBizCom.InputCheck.isEmpty($scope.tels.TELNO1),
                TELNO2: AppBizCom.InputCheck.isEmpty($scope.tels.TELNO2),
                TELNO3: AppBizCom.InputCheck.isEmpty($scope.tels.TELNO3),
                MOBILE_TELNO1: AppBizCom.InputCheck.isEmpty($scope.tels.MOBILE_TELNO1),
                MOBILE_TELNO2: AppBizCom.InputCheck.isEmpty($scope.tels.MOBILE_TELNO2),
                MOBILE_TELNO3: AppBizCom.InputCheck.isEmpty($scope.tels.MOBILE_TELNO3),
                FAXNO1: AppBizCom.InputCheck.isEmpty($scope.tels.FAXNO1),
                FAXNO2: AppBizCom.InputCheck.isEmpty($scope.tels.FAXNO2),
                FAXNO3: AppBizCom.InputCheck.isEmpty($scope.tels.FAXNO3),
            }

            if (tels[target] && (!(tels[chkGroup[0]]) || !(tels[chkGroup[1]]))) {
                return showMsgAndMakeChekResult(true, id, 'KKAP-CM000-01E', param);
            }else{
                return undefined;
            }
        };

        // 電話番号チェック: ご自宅電話番号１の相関チェック（一括）
        var checkTelno1IsInGroup = function(){
            var id = 'txtTelno1';
            var target = 'TELNO1';
            var param = ['ご自宅電話番号１'];
            var chkGroup = ['TELNO2', 'TELNO3'];
            return checkTelIsInGroup(id, target, param, chkGroup);
        };

        // 電話番号チェック: ご自宅電話番号２の相関チェック（一括）
        var checkTelno2IsInGroup = function(){
            var id = 'txtTelno2';
            var target = 'TELNO2';
            var param = ['ご自宅電話番号２'];
            var chkGroup = ['TELNO1', 'TELNO3'];
            return checkTelIsInGroup(id, target, param, chkGroup);
        };

        // 電話番号チェック: ご自宅電話番号３の相関チェック（一括）
        var checkTelno3IsInGroup = function(){
            var id = 'txtTelno3';
            var target = 'TELNO3';
            var param = ['ご自宅電話番号３'];
            var chkGroup = ['TELNO1', 'TELNO2'];
            return checkTelIsInGroup(id, target, param, chkGroup);
        };

        // 電話番号チェック: 携帯電話番号１の相関チェック（一括）
        var checkMobile1IsInGroup = function(){
            var id = 'txtMobileTelno1';
            var target = 'MOBILE_TELNO1';
            var param = ['携帯電話番号１'];
            var chkGroup = ['MOBILE_TELNO2', 'MOBILE_TELNO3'];
            return checkTelIsInGroup(id, target, param, chkGroup);
        };

        // 電話番号チェック: 携帯電話番号２の相関チェック（一括）
        var checkMobile2IsInGroup = function(){
            var id = 'txtMobileTelno2';
            var target = 'MOBILE_TELNO2';
            var param = ['携帯電話番号２'];
            var chkGroup = ['MOBILE_TELNO1', 'MOBILE_TELNO3'];
            return checkTelIsInGroup(id, target, param, chkGroup);
        };

        // 電話番号チェック: 携帯電話番号３の相関チェック（一括）
        var checkMobile3IsInGroup = function(){
            var id = 'txtMobileTelno3';
            var target = 'MOBILE_TELNO3';
            var param = ['携帯電話番号３'];
            var chkGroup = ['MOBILE_TELNO1', 'MOBILE_TELNO2'];
            return checkTelIsInGroup(id, target, param, chkGroup);
        };

        // 電話番号チェック: FAX番号１の相関チェック（一括）
        var checkFaxno1IsInGroup = function(){
            var id = 'txtFaxno1';
            var target = 'FAXNO1';
            var param = ['FAX番号１'];
            var chkGroup = ['FAXNO2', 'FAXNO3'];
            return checkTelIsInGroup(id, target, param, chkGroup);
        };

        // 電話番号チェック: FAX番号２の相関チェック（一括）
        var checkFaxno2IsInGroup = function(){
            var id = 'txtFaxno2';
            var target = 'FAXNO2';
            var param = ['FAX番号２'];
            var chkGroup = ['FAXNO1', 'FAXNO3'];
            return checkTelIsInGroup(id, target, param, chkGroup);
        };

        // 電話番号チェック: FAX番号３の相関チェック（一括）
        var checkFaxno3IsInGroup = function(){
            var id = 'txtFaxno3';
            var target = 'FAXNO3';
            var param = ['FAX番号３'];
            var chkGroup = ['FAXNO1', 'FAXNO2'];
            return checkTelIsInGroup(id, target, param, chkGroup);
        };

        // 電話番号チェック: 登録抹消と既存登録情報の相関チェック（一括汎用）
        var checkDelTels = function(ids, target, param) {
            var dels = {
                TELNO_DEL: {
                    del: (($scope.tels.TELNO_DEL == 1) ? true : false),
                    isEmpty: ((AppBizCom.InputCheck.isEmpty($scope.telsBefore.TELNO1) && AppBizCom.InputCheck.isEmpty($scope.telsBefore.TELNO2) && AppBizCom.InputCheck.isEmpty($scope.telsBefore.TELNO3)))
                },
                MOBILE_TELNO_DEL: {
                    del: (($scope.tels.MOBILE_TELNO_DEL == 1) ? true : false),
                    isEmpty: ((AppBizCom.InputCheck.isEmpty($scope.telsBefore.MOBILE_TELNO1) && AppBizCom.InputCheck.isEmpty($scope.telsBefore.MOBILE_TELNO2) && AppBizCom.InputCheck.isEmpty($scope.telsBefore.MOBILE_TELNO3)))
                },
                FAXNO_DEL: {
                    del: (($scope.tels.FAXNO_DEL == 1) ? true : false),
                    isEmpty: ((AppBizCom.InputCheck.isEmpty($scope.telsBefore.FAXNO1) && AppBizCom.InputCheck.isEmpty($scope.telsBefore.FAXNO2) && AppBizCom.InputCheck.isEmpty($scope.telsBefore.FAXNO3)))
                }
            }
            // （現在契約内容:自宅なし / 入力内容:自宅抹消）の場合エラー
            // （現在契約内容:携帯なし / 入力内容:携帯抹消）の場合エラー
            if (dels[target].del && dels[target].isEmpty) {
                return showMsgAndMakeChekResult(true, ids, 'KKAP-SFJ06-04E', param);
            } else {
                return undefined;
            }
        };

        // 電話番号チェック: 登録抹消（ご自宅電話番号）と既存登録情報（ご自宅電話番号）の相関チェック（一括）
        var checkDelTelnos = function(){
            var ids = 'chkboxTelDel';
            var target = 'TELNO_DEL';
            var param = ['登録抹消（ご自宅電話番号）'];
            return checkDelTels(ids, target, param);
        };

        // 電話番号チェック: 登録抹消（携帯電話番号）と既存登録情報（携帯電話番号）の相関チェック（一括）
        var checkDelMobiles = function(){
            var ids = 'chkboxMobileTelDel';
            var target = 'MOBILE_TELNO_DEL';
            var param = ['登録抹消（携帯電話番号）'];
            return checkDelTels(ids, target, param);
        };

        // 電話番号チェック: 登録抹消（FAX番号）と既存登録情報（FAX番号）の相関チェック（一括）
        var checkDelFaxs = function(){
            var ids = 'chkboxFaxnoDel';
            var target = 'FAXNO_DEL';
            var param = ['登録抹消（FAX番号）'];
            return checkDelTels(ids, target, param);
        };

        // 電話番号チェック: 登録抹消と既存登録情報の相関チェック2（一括汎用）
        var checkDelTels2 = function(ids, target1, target2, param) {
            var dels = {
                TELNO_DEL: {
                    noInput: (AppBizCom.InputCheck.isEmpty($scope.tels.TELNO1) && AppBizCom.InputCheck.isEmpty($scope.tels.TELNO2) && AppBizCom.InputCheck.isEmpty($scope.tels.TELNO3)),
                    del: (($scope.tels.TELNO_DEL == 1) ? true : false),
                    isEmpty: ((AppBizCom.InputCheck.isEmpty($scope.telsBefore.TELNO1) && AppBizCom.InputCheck.isEmpty($scope.telsBefore.TELNO2) && AppBizCom.InputCheck.isEmpty($scope.telsBefore.TELNO3)))
                },
                MOBILE_TELNO_DEL: {
                    noInput: (AppBizCom.InputCheck.isEmpty($scope.tels.MOBILE_TELNO1) && AppBizCom.InputCheck.isEmpty($scope.tels.MOBILE_TELNO2) && AppBizCom.InputCheck.isEmpty($scope.tels.MOBILE_TELNO3)),
                    del: (($scope.tels.MOBILE_TELNO_DEL == 1) ? true : false),
                    isEmpty: ((AppBizCom.InputCheck.isEmpty($scope.telsBefore.MOBILE_TELNO1) && AppBizCom.InputCheck.isEmpty($scope.telsBefore.MOBILE_TELNO2) && AppBizCom.InputCheck.isEmpty($scope.telsBefore.MOBILE_TELNO3)))
                }
            }
            // （現在契約内容:自宅あり、携帯なし / 入力内容:自宅抹消、携帯未入力）の場合エラー
            // （現在契約内容:自宅なし、携帯あり / 入力内容:携帯抹消、自宅未入力）の場合エラー
            if (dels[target1].del && !dels[target1].isEmpty && dels[target2].isEmpty && dels[target2].noInput) {
                return showMsgAndMakeChekResult(true, ids, 'KKAP-SFJ06-04E', param);
            } else {
                return undefined;
            }
        };
 
        // 電話番号チェック: 登録抹消（ご自宅電話番号）と既存登録情報（ご自宅電話番号）の相関チェック2（一括）
        var checkDelTelnos2 = function() {
            var ids = 'chkboxTelDel';
            var target1 = 'TELNO_DEL';
            var target2 = 'MOBILE_TELNO_DEL';
            var param = ['登録抹消（ご自宅電話番号）'];
            return checkDelTels2(ids, target1, target2, param);
        };

        // 電話番号チェック: 登録抹消（携帯電話番号）と既存登録情報（携帯電話番号）の相関チェック2（一括）
        var checkDelMobiles2 = function() {
            var ids = 'chkboxMobileTelDel';
            var target1 = 'MOBILE_TELNO_DEL';
            var target2 = 'TELNO_DEL';
            var param = ['登録抹消（携帯電話番号）'];
            return checkDelTels2(ids, target1, target2, param);
        };

        // 電話番号チェック: 登録抹消（ご自宅電話番号）と登録抹消（携帯電話番号）の相関チェック（一括）
        var checkDelTelMobile = function(checkResult){
            var delTelnosNotEmpty = ($scope.tels.TELNO_DEL == 1) ? true : false;
            var delMobileTelnosNotEmpty = ($scope.tels.MOBILE_TELNO_DEL == 1) ? true : false;

            if (!checkExistError('chkboxTelDel', 'chkboxMobileTelDel') && delTelnosNotEmpty && delMobileTelnosNotEmpty){
                var msgId = 'KKAP-SFJ06-28E';
                var param = [];
                var ids1 = 'chkboxTelDel';
                var ids2 = 'chkboxMobileTelDel';
                var target1 = 'TELNO_DEL';
                var target2 = 'MOBILE_TELNO_DEL';
                var value1 = $scope.tels.TELNO_DEL;
                var value2 = $scope.tels.MOBILE_TELNO_DEL;
                showErrorItemsGroup(
                    ids1,
                    AppBizCom.Msg.getMsg(msgId, param),
                    msgId,
                    true
                );
                checkResult1Update(target1, value1, msgId, checkResult);
                showErrorItemsGroup(
                    ids2,
                    AppBizCom.Msg.getMsg(msgId, param),
                    msgId,
                    true
                );
                checkResult1Update(target2, value2, msgId, checkResult);
                return true;
            } else {
                return false;
            }
        };
        
        // 電話番号チェック: 電話番号1～3の最大桁数の相関チェック と 電話番号1～3の変更前と同内容の相関チェック（一括汎用）
        var checkTelGroupMxlnAndSameOfOld = function(ids, target, param, maxLegth, checkResult, notCheckMxln=false){
            var groups = {
                TELNO: {
                    before : [$scope.telsBefore.TELNO1, $scope.telsBefore.TELNO2, $scope.telsBefore.TELNO3],
                    new : [$scope.tels.TELNO1, $scope.tels.TELNO2, $scope.tels.TELNO3]
                },
                MOBILE_TELNO: {
                    before : [$scope.telsBefore.MOBILE_TELNO1, $scope.telsBefore.MOBILE_TELNO2, $scope.telsBefore.MOBILE_TELNO3],
                    new : [$scope.tels.MOBILE_TELNO1, $scope.tels.MOBILE_TELNO2, $scope.tels.MOBILE_TELNO3]
                },
                FAXNO: {
                    before : [$scope.telsBefore.FAXNO1, $scope.telsBefore.FAXNO2, $scope.telsBefore.FAXNO3],
                    new : [$scope.tels.FAXNO1, $scope.tels.FAXNO2, $scope.tels.FAXNO3]
                }
            }
            var errFlg = false;
            var str = groups[target].new.join('');
            var beforeStr = groups[target].before.join('');
            var strNotEmpty = (str.length > 0) ? true : false;
            if (!notCheckMxln && strNotEmpty && str.length > maxLegth){
                var msgId = 'KKAP-CM000-09E';
                showErrorItemsGroup(ids, AppBizCom.Msg.getMsg(msgId, param), msgId, true);
                checkResult1Update(target, str, msgId, checkResult);
                errFlg = true;
            }
            if (strNotEmpty && (str === beforeStr)) {
                var msgId = 'KKAP-SFJ06-10E';
                showErrorItemsGroup(ids, AppBizCom.Msg.getMsg(msgId, param), msgId, true);
                checkResult1Update(target, str, msgId, checkResult);
                errFlg = true;
            }
            if (errFlg) {
                return true;
            } else {
                return false;
            }
        };

        // 電話番号チェック: ご自宅電話番号１～３、携帯電話番号１～３、FAX番号１～３、全項目の相関チェック（一括）
        var checkTels = function(checkResult){
            // ご自宅電話番号、携帯電話番号、FAX番号何れも入力されていない場合エラー。
            var tels =AppBizCom.InputCheck.isEmpty($scope.tels.TELNO1) && AppBizCom.InputCheck.isEmpty($scope.tels.TELNO2) && AppBizCom.InputCheck.isEmpty($scope.tels.TELNO3);
            var mobiles = AppBizCom.InputCheck.isEmpty($scope.tels.MOBILE_TELNO1) && AppBizCom.InputCheck.isEmpty($scope.tels.MOBILE_TELNO2) && AppBizCom.InputCheck.isEmpty($scope.tels.MOBILE_TELNO3);
            var faxs = AppBizCom.InputCheck.isEmpty($scope.tels.FAXNO1) && AppBizCom.InputCheck.isEmpty($scope.tels.FAXNO2) && AppBizCom.InputCheck.isEmpty($scope.tels.FAXNO3);

            if (tels && mobiles && faxs) {
                var msgId = 'KKAP-SFJ06-09E';
                var target = 'TELNO_F';
                showErrorMsg(
                    'txtTel-txtMobile-txtFax', 
                    'txtTel-txtMobile-txtFax', 
                    AppBizCom.Msg.getMsg(msgId, []), 
                    msgId
                )
                showGroupErrorItem('txtTelno1-txtTelno2-txtTelno3-txtMobileTelno1-txtMobileTelno2-txtMobileTelno3-txtFaxno1-txtFaxno2-txtFaxno3');
                checkResult1Update(target, undefined, msgId, checkResult);
                return true;
            }
            return false;
        };

        // 電話番号チェック: ご自宅電話番号１～３、携帯電話番号１～３、全項目の相関チェック（一括）
        var checkTelMobiles = function(checkResult){
            // 変更前情報がご自宅･携帯共に未登録で、ご自宅電話番号、携帯電話番号何れも入力されていない場合エラー。
            var oldTels = AppBizCom.InputCheck.isEmpty($scope.telsBefore.TELNO1) && AppBizCom.InputCheck.isEmpty($scope.telsBefore.TELNO2) && AppBizCom.InputCheck.isEmpty($scope.telsBefore.TELNO3);
            var oldMobiles = AppBizCom.InputCheck.isEmpty($scope.telsBefore.MOBILE_TELNO1) && AppBizCom.InputCheck.isEmpty($scope.telsBefore.MOBILE_TELNO2) && AppBizCom.InputCheck.isEmpty($scope.telsBefore.MOBILE_TELNO3);

            var tels = AppBizCom.InputCheck.isEmpty($scope.tels.TELNO1) && AppBizCom.InputCheck.isEmpty($scope.tels.TELNO2) && AppBizCom.InputCheck.isEmpty($scope.tels.TELNO3);
            var mobiles = AppBizCom.InputCheck.isEmpty($scope.tels.MOBILE_TELNO1) && AppBizCom.InputCheck.isEmpty($scope.tels.MOBILE_TELNO2) && AppBizCom.InputCheck.isEmpty($scope.tels.MOBILE_TELNO3);

            if (oldTels && oldMobiles && tels && mobiles) {
                var msgId = 'KKAP-SF014-09E';
                var target = 'TELNO_F';
                showErrorMsg(
                    'txtTel-txtMobile', 
                    'txtTel-txtMobile', 
                    AppBizCom.Msg.getMsg(msgId, []), 
                    msgId
                )
                showGroupErrorItem('txtTelno1-txtTelno2-txtTelno3-txtMobileTelno1-txtMobileTelno2-txtMobileTelno3');
                checkResult1Update(target, undefined, msgId, checkResult);
                return true;
            }
            return false;
        };

        // 電話番号チェック: ご自宅電話番号１規定値チェックエラー（随時、一括）
        var checkTelno1 = function(){
            var chkRes = undefined;

            if ($scope.tels.TELNO1){
                // ご自宅電話番号１の1桁目が0以外の場合エラー。
                chkRes = checkValueEqual('txtTelno1', '0', false, 'KKAP-SF014-07E', ['ご自宅電話番号１'], $scope.tels.TELNO1.slice(0, 1));
                if (chkRes) return chkRes;

                // ご自宅電話番号１に0120若しくは0800が入力された場合エラー。
                if (['0120', '0800'].indexOf($scope.tels.TELNO1) >= 0){
                    return showMsgAndMakeChekResult(false, 'txtTelno1', 'KKAP-SF014-06E', ['ご自宅電話番号１']);
                }

                // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
                // ご自宅電話番号入力1の頭二桁が00の場合エラー。
                {
                    var regExpStr = /^00/;
                    var matchRes = $scope.tels.TELNO1 ? $scope.tels.TELNO1.match(regExpStr) : undefined;
                    if (matchRes) {
                        return showMsgAndMakeChekResult(false, 'txtTelno1', 'KKAP-SF014-22E', ['ご自宅電話番号１']);
                    }
                }
                // ご自宅電話番号入力1に0x0が入力された場合エラー。(xは1～9の数字)
                {
                    var regExpStr = /^0[1-9]0$/;
                    var matchRes = $scope.tels.TELNO1 ? $scope.tels.TELNO1.match(regExpStr) : undefined;
                    if (matchRes) {
                        return showMsgAndMakeChekResult(false, 'txtTelno1', 'KKAP-SF014-23E', ['ご自宅電話番号１']);
                    }
                }
                // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913

            }
            return chkRes;
        };

        // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
        // ご自宅電話番号桁数チェック3
        var telLengthCheck3 = function () {
            var result;
            // ご自宅電話番号1,2いずれかが入力されている場合のみチェック実施
            if ($scope.tels.TELNO1 || $scope.tels.TELNO2) {
                return telLengthCheck3Blur();
            }
        }
        // ご自宅電話番号桁数チェック3(決定時)
        var telLengthCheck3Blur = function () {
            var result;
            if (
                $scope.tels.TELNO3
                && (AppBizCom.InputCheck.chkMaxLength($scope.tels.TELNO3, 4) != 0)
            ) {
                // 桁数が4桁以外で入力された場合エラー。
                result = {
                    errId: 'KKAP-CM000-04E',
                    errMsg: AppBizMsg.getMsg('KKAP-CM000-04E', ['ご自宅電話番号３', 4])
                };
                return result;
            }
        }
        // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913

        // 電話番号チェック: 「ご自宅電話番号１」～「ご自宅電話番号３」を合せた桁数が10桁を超えた場合エラー（随時）
        var checkTelGroupMaxLength = function(){
            return checkExistError('txtTelno1', 'txtTelno2', 'txtTelno3') ?  undefined : 
                checkGroupMaxLength('txtTelno1-txtTelno2-txtTelno3', 10, true, 'KKAP-CM000-09E', ['ご自宅電話番号', '10'], true, $scope.tels.TELNO1, $scope.tels.TELNO2, $scope.tels.TELNO3);
        };

        // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
        // 自宅電話番号1入力欄~自宅電話番号2入力欄の桁数の組み合わせが特定の場合以外エラー
        var checkTel12Length = function () {
            if (!$scope.tels.TELNO1 || !$scope.tels.TELNO2) {
                return;
            }

            // 桁数が既定の正しい組み合わせと一致するかチェック
            var tel12CorrectLength = [
                {'tel1length': 2, 'tel2length': 3},
                {'tel1length': 2, 'tel2length': 4},
                {'tel1length': 3, 'tel2length': 2},
                {'tel1length': 3, 'tel2length': 3},
                {'tel1length': 4, 'tel2length': 1},
                {'tel1length': 4, 'tel2length': 2}
            ];

            for (var i = 0; i < tel12CorrectLength.length; i++) {
                var correct = tel12CorrectLength[i];
                if ($scope.tels.TELNO1.length === correct.tel1length && $scope.tels.TELNO2.length === correct.tel2length){
                    return;
                }
            }
            // 桁数が既定の組み合わせでないため、エラー
            return checkExistError('txtTelno1-txtTelno2') ? undefined : 
                showMsgAndMakeChekResult(true, 'txtTelno1-txtTelno2', 'KKAP-SF014-24E', ['ご自宅電話番号１', 'ご自宅電話番号２']);
        };
        // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913

        // 電話番号チェック: 携帯電話番号１が数字以外で入力された場合エラー（随時、一括）
        var checkMobileTelno1 = function(){
            if ($scope.tels.MOBILE_TELNO1) {
                // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
                var regExpStr = /^0[3-9]0$/;
                // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913
                var matchRes = $scope.tels.MOBILE_TELNO1.match(regExpStr);
                if (matchRes) {
                    return undefined;
                } else {
                    return { errId: 'KKAP-SF014-21E', errMsg: AppBizCom.Msg.getMsg('KKAP-SF014-21E', []) };
                }
            } else {
                return undefined;
            }
        };

        // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
        // 携帯電話番号桁数チェック2
        var mobileLengthCheck2 = function () {
            var result;
            // ご自宅電話番号1,3いずれかが入力されている場合のみチェック実施
            if ($scope.tels.MOBILE_TELNO1 || $scope.tels.MOBILE_TELNO3) {
                return mobileLengthCheck2Blur();
            }
        }
        // 携帯電話番号桁数チェック2(決定時)
        var mobileLengthCheck2Blur = function () {
            var result;
            if (
                $scope.tels.MOBILE_TELNO2
                && (AppBizCom.InputCheck.chkMaxLength($scope.tels.MOBILE_TELNO2, 4) != 0)
            ) {
                // 桁数が4桁以外で入力された場合エラー。
                result = {
                    errId: 'KKAP-CM000-04E',
                    errMsg: AppBizMsg.getMsg('KKAP-CM000-04E', ['携帯電話番号２', 4])
                };
                return result;
            }
        }

        // 携帯電話番号桁数チェック3
        var mobileLengthCheck3 = function () {
            var result;
            // ご自宅電話番号1,3いずれかが入力されている場合のみチェック実施
            if ($scope.tels.MOBILE_TELNO1 || $scope.tels.MOBILE_TELNO2) {
                return mobileLengthCheck3Blur();
            }
        }
        // 携帯電話番号桁数チェック3(決定時)
        var mobileLengthCheck3Blur = function () {
            var result;
            if (
                $scope.tels.MOBILE_TELNO3
                && (AppBizCom.InputCheck.chkMaxLength($scope.tels.MOBILE_TELNO3, 4) != 0)
            ) {
                // 桁数が4桁以外で入力された場合エラー。
                result = {
                    errId: 'KKAP-CM000-04E',
                    errMsg: AppBizMsg.getMsg('KKAP-CM000-04E', ['携帯電話番号３', 4])
                };
                return result;
            }
        }
        // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913

        // 電話番号チェック: FAX番号１規定値チェックエラー（随時、一括）
        var checkFaxno1 = function(){
            var chkRes = undefined;

            if ($scope.tels.FAXNO1){
                // FAX番号１の1桁目が0以外の場合エラー。
                chkRes = checkValueEqual('txtFaxno1', '0', false, 'KKAP-SF014-07E', ['FAX番号１'], $scope.tels.FAXNO1.slice(0, 1));
                if (chkRes) return chkRes;

                // FAX番号１に0120若しくは0800が入力された場合エラー。
                if (['0120', '0800'].indexOf($scope.tels.FAXNO1) >= 0){
                    return showMsgAndMakeChekResult(false, 'txtFaxno1', 'KKAP-SF014-06E', ['FAX番号１']);
                }

                // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
                // FAX番号入力１の頭二桁が00の場合エラー。
                {
                    var regExpStr = /^00/;
                    var matchRes = $scope.tels.FAXNO1 ? $scope.tels.FAXNO1.match(regExpStr) : undefined;
                    if (matchRes) {
                        return showMsgAndMakeChekResult(false, 'txtFaxno1', 'KKAP-SF014-22E', ['FAX番号１']);
                    }
                }
                // FAX番号入力１に0x0が入力された場合エラー。(xは1～9の数字)
                {
                    var regExpStr = /^0[1-9]0$/;
                    var matchRes = $scope.tels.FAXNO1 ? $scope.tels.FAXNO1.match(regExpStr) : undefined;
                    if (matchRes) {
                        return showMsgAndMakeChekResult(false, 'txtFaxno1', 'KKAP-SF014-23E', ['FAX番号１']);
                    }
                }
                // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913
            }
            return chkRes;
        };

        // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
        // FAX番号桁数チェック3
        var faxLengthCheck3 = function () {
            var result;
            // FAX番号1,2いずれかが入力されている場合のみチェック実施
            if ($scope.tels.FAXNO1 || $scope.tels.FAXNO2) {
                return faxLengthCheck3Blur();
            }
        }
        // FAX番号桁数チェック3(決定時)
        var faxLengthCheck3Blur = function () {
            var result;
            if (
                $scope.tels.FAXNO3
                && (AppBizCom.InputCheck.chkMaxLength($scope.tels.FAXNO3, 4) != 0)
            ) {
                // 桁数が4桁以外で入力された場合エラー。
                result = {
                    errId: 'KKAP-CM000-04E',
                    errMsg: AppBizMsg.getMsg('KKAP-CM000-04E', ['FAX番号３', 4])
                };
                return result;
            }
        }
        // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913

        // 電話番号チェック: 「FAX番号１」～「FAX番号３」を合せた桁数が10桁を超えた場合エラー（随時）
        var checkFaxGroupMaxLength = function(){
            return checkExistError('txtFaxno1', 'txtFaxno2', 'txtFaxno3') ?  undefined : 
            checkGroupMaxLength('txtFaxno1-txtFaxno2-txtFaxno3', 10, true, 'KKAP-CM000-09E', ['FAX番号', '10'], true, $scope.tels.FAXNO1, $scope.tels.FAXNO2, $scope.tels.FAXNO3);
        };

        // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
        // FAX番号1入力欄~FAX番号2入力欄の桁数の組み合わせが特定の場合以外エラー
        var checkFax12Length = function () {
            if (!$scope.tels.FAXNO1 || !$scope.tels.FAXNO2) {
                return;
            }

            // 桁数が既定の正しい組み合わせと一致するかチェック
            var fax12CorrectLength = [
                {'fax1length': 2, 'fax2length': 3},
                {'fax1length': 2, 'fax2length': 4},
                {'fax1length': 3, 'fax2length': 2},
                {'fax1length': 3, 'fax2length': 3},
                {'fax1length': 4, 'fax2length': 1},
                {'fax1length': 4, 'fax2length': 2}
            ];

            for (var i = 0; i < fax12CorrectLength.length; i++){
                var correct = fax12CorrectLength[i];
                if ($scope.tels.FAXNO1.length === correct.fax1length && $scope.tels.FAXNO2.length === correct.fax2length){
                    return;
                }
            }
            // 桁数が既定の組み合わせでないため、エラー
            return checkExistError('txtFaxno1-txtFaxno2') ? undefined : 
                showMsgAndMakeChekResult(true, 'txtFaxno1-txtFaxno2', 'KKAP-SF014-24E', ['FAX番号１', 'FAX番号２']);
        };
        // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913

        // 日興カードチェック: 日興カードの相関チェック（一括）
        var checkNkCard = function() {
            var nkCardNotExist = ($scope.nkCardBefore.NIKKO_CARD == stringConst.Mihakko) ? true : false;
            var nkCardSelected = $scope.nkCard.NIKKO_CARD;
            if (!nkCardNotExist && nkCardSelected == '1') {
                // 既契約済みの場合に申込[1]選択されている場合エラー。
                return { errId: 'KKAP-SFJ06-01E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-01E', ['申込区分']) };
            } else if (nkCardNotExist && (nkCardSelected == '2' || nkCardSelected == '3')) {  
                // 未契約の場合に解除[2]選択されている場合エラー。
                // 未契約の場合に再発行[3]選択されている場合エラー。
                return { errId: 'KKAP-SFJ06-02E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-02E', ['申込区分']) };
            } else {
                return undefined;
            }
        };

        // 日興イージートレードチェック: 日興イージートレードの相関チェック（一括）
        var checkNkEZ = function() {
            var nkEZNotExist = ($scope.ezTradeBefore.NIKKO_EZ == stringConst.Mimoshikomi) ? true : false;
            var nkEZSelected = $scope.ezTrade.NIKKO_EZ;
            var courseType = $scope.otherBefore.DIRECT_K; // ダイレクトコース申込 0:未契約 1:契約
            if (!nkEZNotExist && nkEZSelected == '1') {
                // 既契約済みの場合に申込[1]選択されている場合エラー。
                return { errId: 'KKAP-SFJ06-01E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-01E', ['申込区分']) };
            } else if (nkEZNotExist && (nkEZSelected == '2' || nkEZSelected == '3')) {
                // 未契約の場合に解除[2]選択されている場合エラー。
                // 未契約の場合に再発行[3]選択されている場合エラー。
                return { errId: 'KKAP-SFJ06-02E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-02E', ['申込区分']) };
            } else if (!nkEZNotExist && nkEZSelected == '2' && courseType == '1') {
                // 既契約済みの場合に解除[2]選択されている場合エラー。※ ダイレクトコース
                return { errId: 'KKAP-SFJ06-03E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-03E', ['申込区分']) };
            } else {
                return undefined;
            }
        };

        // 特定口座チェック: 特定口座申込区分の相関チェック（一括）
        var checkTkteiKozaMskm = function() {
            var tkteiKozaNotExist = ($scope.tkKozaBefore.TKTEI_KOZA_OPENYMD == stringConst.Mikaisetsu) ? true : false;
            var tkteiKozaSelected = $scope.tkKoza.TKTEI_KOZA_MSKM;
            if (!tkteiKozaNotExist && tkteiKozaSelected == '1') {
                // 既開設済みの場合に申込[1]選択されている場合エラー。
                return { errId: 'KKAP-SFJ06-01E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-01E', ['申込区分']) };
            } else if (tkteiKozaNotExist && (tkteiKozaSelected == '2' || tkteiKozaSelected == '3')) {  
                // 未契約の場合に変更[2]または廃止[3]選択されている場合エラー。
                return { errId: 'KKAP-SFJ06-02E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-02E', ['申込区分']) };
            } else {
                return undefined;
            }
        };

        // 特定口座チェック: 特定口座勘定区分の必須チェック（一括）
        var checkTkteiKozaAcIsEmpty = function() {
            var tkteiKozaSelected = $scope.tkKoza.TKTEI_KOZA_MSKM;
            var tkteiKozaAcIsEmpty = AppBizCom.InputCheck.isEmpty($scope.tkKoza.TKTEI_KOZA_AC);
            // 特定口座勘定区分選択が行われていない場合エラー。 ※ 申込区分が開設を選択した場合
            if (!checkExistError('radioTkKoza') && tkteiKozaSelected == '1' && tkteiKozaAcIsEmpty) {
                return { errId: 'KKAP-CM000-02E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-02E', ['勘定区分']) };
            } else {
                return undefined;
            }
        };

        // 特定口座チェック: 特定口座勘定区分の相関チェック（一括）
        var checkTkteiKozaAc = function() {
            var tkteiKozaSelected = $scope.tkKoza.TKTEI_KOZA_MSKM;
            var tkteiKozaGnsnIsEmpty = AppBizCom.InputCheck.isEmpty($scope.tkKoza.TKTEI_KOZA_GNSN);
            var tkteiKozaYykIsEmpty = AppBizCom.InputCheck.isEmpty($scope.tkKoza.TKTEI_KOZA_YYK);
            var tkteiKozaAc = $scope.tkKoza.TKTEI_KOZA_AC;
            var tkteiKozaAcNotEmpty = !AppBizCom.InputCheck.isEmpty(tkteiKozaAc);
            var tkteiKozaAcBefore = $scope.tkKozaBefore.TKTEI_KOZA_AC;
            // 勘定区分に変更がない選択が行われた場合エラー。
            // ※ 特定口座源泉徴収選択・配当等受入、源泉徴収変更予約ともに選択されていない場合に限る
            // ※ 申込区分が変更を選択した場合
            if (!checkExistError('radioTkKoza') && tkteiKozaSelected == '2' && tkteiKozaGnsnIsEmpty && tkteiKozaYykIsEmpty && tkteiKozaAcNotEmpty && (tkteiKozaAc == tkteiKozaAcBefore)) {
                return { errId: 'KKAP-SFJ06-01E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-01E', ['勘定区分']) };
            } else {
                return undefined;
            }
        };

        // 特定口座チェック: 特定口座源泉徴収選択・配当等受入の必須チェック（一括）
        var checkTkteiKozaGnsnIsEmpty = function() {
            var tkteiKozaSelected = $scope.tkKoza.TKTEI_KOZA_MSKM;
            var tkteiKozaGnsnIsEmpty = AppBizCom.InputCheck.isEmpty($scope.tkKoza.TKTEI_KOZA_GNSN);
            // 特定口座源泉徴収選択・配当等受入選択が行われていない場合エラー。 ※ 申込区分が開設を選択した場合
            if (!checkExistError('radioTkKoza') && tkteiKozaSelected == '1' && tkteiKozaGnsnIsEmpty) {
                return { errId: 'KKAP-CM000-02E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-02E', ['特定口座源泉徴収選択・配当等受入']) };
            } else {
                return undefined;
            }
        };

        // 特定口座チェック: 特定口座源泉徴収選択・配当等受入の相関チェック1（一括）
        var checkTkteiKozaGnsn1 = function() {
            var tkteiKozaSelected = $scope.tkKoza.TKTEI_KOZA_MSKM;
            var tkteiKozaGnsn = $scope.tkKoza.TKTEI_KOZA_GNSN;
            var tkteiKozaGnsnNotEmpty = !AppBizCom.InputCheck.isEmpty(tkteiKozaGnsn);
            var tkteiKozaGnsnBefore = $scope.tkKozaBefore.TKTEI_KOZA_GNSN;
            // 特定口座源泉徴収選択・配当等受入に変更がない選択が行われた場合エラー。 ※ 申込区分が変更を選択した場合
            if (!checkExistError('radioTkKoza') && tkteiKozaSelected == '2' && tkteiKozaGnsnNotEmpty && (tkteiKozaGnsn == tkteiKozaGnsnBefore)) {
                return { errId: 'KKAP-SFJ06-01E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-01E', ['特定口座源泉徴収選択・配当等受入']) };
            } else {
                return undefined;
            }
        };

        // 特定口座チェック: 特定口座源泉徴収選択・配当等受入の相関チェック2（一括）
        var checkTkteiKozaGnsn2 = function() {
            var tkteiKozaSelected = $scope.tkKoza.TKTEI_KOZA_MSKM;
            var tkteiKozaGnsnNotEmpty = !AppBizCom.InputCheck.isEmpty($scope.tkKoza.TKTEI_KOZA_GNSN);
            var tkteiKozaNensyTorihikiYmdBeforeIsAri = ($scope.tkKozaBefore.TKTEI_KOZA_NENSY_TORIHIKIYMD == stringConst.Ari) ? true : false;;
            // 年初取引ありで、特定口座源泉徴収選択・配当等受入が選択された場合エラー。※ 申込区分が変更を選択した場合
            if (!checkExistError('radioTkKoza') && tkteiKozaSelected == '2' && tkteiKozaNensyTorihikiYmdBeforeIsAri && tkteiKozaGnsnNotEmpty) {
                return { errId: 'KKAP-SFJ06-05E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-05E', []) };
            } else {
                return undefined;
            }
        };

        // 特定口座チェック: 年初住所の相関チェック（一括）
        var checkTkteiKozaNensyJsyIsEmpty = function() {
            var tkteiKozaSelected = $scope.tkKoza.TKTEI_KOZA_MSKM;
            var tkteiKozaGnsnIsAri = ($scope.tkKoza.TKTEI_KOZA_GNSN == '1') ? true : false;
            var tkteiKozaNensyJsyIsEmpty = AppBizCom.InputCheck.isEmpty($scope.tkKoza.TKTEI_KOZA_NENSY_JSY);
            // 特定口座源泉徴収選択・配当等受入選択で源泉徴収ありを選択時に、年初住所が選択されていない場合エラー。 ※ 申込区分が開設を選択した場合
            // 特定口座源泉徴収選択・配当等受入選択で源泉徴収ありを選択時に、年初住所が選択されていない場合エラー。 ※ 申込区分が変更を選択した場合
            if (!checkExistError('radioTkKoza') && (tkteiKozaSelected == '1' || tkteiKozaSelected == '2') && tkteiKozaGnsnIsAri && tkteiKozaNensyJsyIsEmpty) {
                return { errId: 'KKAP-CM000-02E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-02E', ['年初住所']) };
            } else {
                return undefined;
            }
        };

        // 特定口座チェック: 源泉徴収変更予約の相関チェック1（一括）
        var checkTkteiKozaYyk1 = function() {
            // 事前情報の「予約情報」が空の場合（「源泉徴収予約日」が当年ではない、00000000）、チェック不要
            if ('' == $scope.tkKozaBefore.TKTEI_KOZA_YYK_NM) {
                return undefined;
            }
            var tkteiKozaSelected = $scope.tkKoza.TKTEI_KOZA_MSKM;
            var tkteiKozaYyk = $scope.tkKoza.TKTEI_KOZA_YYK;
            var tkteiKozaYykNotEmpty = !AppBizCom.InputCheck.isEmpty(tkteiKozaYyk);
            var tkteiKozaYykBefore = $scope.tkKozaBefore.TKTEI_KOZA_YYK;
            // 源泉徴収変更予約に変更がない選択が行われた場合エラー。※ 申込区分が変更を選択した場合
            if (!checkExistError('radioTkKoza') && tkteiKozaSelected == '2' && tkteiKozaYykNotEmpty && (tkteiKozaYyk == tkteiKozaYykBefore)) {
                return { errId: 'KKAP-SFJ06-01E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-01E', ['源泉徴収変更予約']) };
            } else {
                return undefined;
            }
        };

        // 特定口座チェック: 源泉徴収変更予約の相関チェック2（一括）
        var checkTkteiKozaYyk2 = function() {
            var tkteiKozaSelected = $scope.tkKoza.TKTEI_KOZA_MSKM;
            var today = new Date(gyomuDate);
            var today_month = today.getMonth() + 1;
            var today_date = today.getDate();
            var errFlg = (today_month >= 1 && today_date >= 1 && today_month <= 3 && today_date <= 31) ? true : false;
            var tkteiKozaYykNotEmpty = !AppBizCom.InputCheck.isEmpty($scope.tkKoza.TKTEI_KOZA_YYK);
            // お申し込みされた日が該当年1月～3月の期間中で、源泉徴収変更予約が選択された場合場合エラー。※ 申込区分が変更を選択した場合
            if (!checkExistError('radioTkKoza') && tkteiKozaSelected == '2' && errFlg && tkteiKozaYykNotEmpty) {
                return { errId: 'KKAP-SFJ06-06E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-06E', []) };
            } else {
                return undefined;
            }
        };

        // 特定口座チェック: 源泉徴収変更予約の相関チェック3（一括）
        var checkTkteiKozaYyk3 = function() {
            var tkteiKozaSelected = $scope.tkKoza.TKTEI_KOZA_MSKM;
            var tkteiKozaGnsnBefore = $scope.tkKozaBefore.TKTEI_KOZA_GNSN;
            var tkteiKozaYykNotEmpty = !AppBizCom.InputCheck.isEmpty($scope.tkKoza.TKTEI_KOZA_YYK);
            var tkteiKozaYyk = $scope.tkKoza.TKTEI_KOZA_YYK;
            if (!checkExistError('radioTkKoza') && tkteiKozaGnsnBefore == '1' && tkteiKozaSelected == '2' && tkteiKozaYykNotEmpty && tkteiKozaYyk == '1') {
                // 特定口座 の源徴区分あり[1]（現契約が 源徴区分あり）の時、源徴予約あり[1]が選択されている場合はエラーとする
                return { errId: 'KKAP-SFJ06-29E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-29E', []) };
            } else if (!checkExistError('radioTkKoza') && tkteiKozaGnsnBefore == '0' && tkteiKozaSelected == '2' && tkteiKozaYykNotEmpty && tkteiKozaYyk == '0') {
                // 特定口座 の源徴区分なし[0]（現契約が 源徴区分なし）の時、源徴予約なし[0]が選択されている場合はエラーとする
                return { errId: 'KKAP-SFJ06-30E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-30E', []) };
            } else {
                return undefined;
            }
        };

        // 特定口座チェック: 特定口座勘定区分、特定口座源泉徴収選択・配当等受入、源泉徴収変更予約の相関チェック（一括）
        var checkTkteiKozaOther = function(checkResult) {
            var tkteiKozaSelected = $scope.tkKoza.TKTEI_KOZA_MSKM;
            var tkteiKozaAcIsEmpty = AppBizCom.InputCheck.isEmpty($scope.tkKoza.TKTEI_KOZA_AC);
            var tkteiKozaGnsnIsEmpty = AppBizCom.InputCheck.isEmpty($scope.tkKoza.TKTEI_KOZA_GNSN);
            var tkteiKozaYykIsEmpty = AppBizCom.InputCheck.isEmpty($scope.tkKoza.TKTEI_KOZA_YYK);
            // 特定口座勘定区分／特定口座源泉徴収選択・配当等受入／源泉徴収変更予約何れも選択されていない場合エラー。 ※ 申込区分が変更を選択した場合
            if (!checkExistError('radioTkKoza') && tkteiKozaSelected == '2' && tkteiKozaAcIsEmpty && tkteiKozaGnsnIsEmpty && tkteiKozaYykIsEmpty) {
                var msgId = 'KKAP-SFJ06-11E';
                var target = 'TKTEI_KOZA_F';
                showErrorItemsGroup(
                    target,
                    AppBizCom.Msg.getMsg(msgId, []),
                    msgId,
                    true
                )
                checkResult1Update(target, undefined, msgId, checkResult);
                return true;
            }
            return false;
        };

        // 特定管理口座チェック: 特定管理口座申込区分の相関チェック（一括）
        var checkTkteiKanriKozaMskm = function() {
            var tkteiKozaSelected = $scope.tkKoza.TKTEI_KOZA_MSKM;
            var tkteiKanriKozaMskmSelected = $scope.tkKanriKoza.TKTEI_KANRI_KOZA_MSKM;
            if (tkteiKozaSelected == '1' && tkteiKanriKozaMskmSelected == '1') {
                // 特定口座申込区分に開設[1]が選択されている場合、特定管理口座に開設[1]が選択された場合エラー。
                return { errId: 'KKAP-SFJ06-26E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-26E', []) };
            } else if (tkteiKozaSelected == '3' && tkteiKanriKozaMskmSelected == '1') {
                // 特定口座申込区分に廃止[3]が選択されている場合、特定管理口座に開設[1]が選択された場合エラー。
                return { errId: 'KKAP-SFJ06-04E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-04E', ['開設']) };
            } else {
                return undefined;
            }
        };

        // NISA口座開設チェック: NISA口座開設申込の相関チェック2（一括）
        var checkNisaKozaMskm1 = function() {
            if (AppBizCom.InputCheck.isEmpty($scope.otherBefore.SEINENYMD)) {
                return undefined;
            }
            var nisaKozaMskmNotEmpty = !AppBizCom.InputCheck.isEmpty($scope.nisa.NISA_KOZA_MSKM);
            var birthY = $scope.otherBefore.SEINENYMD.slice(0, 2);
            var birthM = $scope.otherBefore.SEINENYMD.slice(2, 4);
            var birthD = $scope.otherBefore.SEINENYMD.slice(4, 6);
            // 01-2022-03-250 ＮＩＳＡ成年年齢引き下げ対応（9月対応 開設年齢引下げ）開始 20220920
            var isNisaNoAudlt = !AppBizCom.InputCheck.isAdult($scope.otherBefore.GNGO, birthY, birthM, birthD, gyomuDate);
            // 2023年1月1日以降は18歳未満、2023年1月1日以前は20歳未満のお客様が、NISA口座申込に開設するを選択された場合エラー。
            // 01-2022-03-250 ＮＩＳＡ成年年齢引き下げ対応（9月対応 開設年齢引下げ）終了 20220920
            if (isNisaNoAudlt && nisaKozaMskmNotEmpty) {
                return { errId: 'KKAP-SF015-05E', errMsg: AppBizCom.Msg.getMsg('KKAP-SF015-05E', []) };
            } else {
                return undefined;
            }
        };

        // NISA口座開設チェック: 株式数比例配分方式申込の相関チェック（一括）
        var checkNisaKozaHireihaibun = function() {
            var nisaKozaHireihaibunNotEmpty = !AppBizCom.InputCheck.isEmpty($scope.nisa.HIREIHAIBUN);
            var hireihaibunBefore = $scope.haitkinSunkBefore.HIREIHAIBUN;
            // 既契約済み（株式比例配分方式含む）の場合、株式比例配分方式[2]が選択された場合エラー。
            if (hireihaibunBefore == '2' && nisaKozaHireihaibunNotEmpty) {
                return { errId: 'KKAP-SFJ06-01E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-01E', ['株式数比例配分方式申込']) };
            } else {
                return undefined;
            }
        };

        // 当社から送金する際のお受取口座チェック: 削除するの必須チェック（削除分）
        var checkKozaDelIsEmpty = function(checkResult) {
            var errFlg = false;
            for (var i = 0; i < $scope.kozaModifyFlg.length; i++) {
                if ($scope.kozaModifyFlg[i] == '1' && $scope.kozaDel[i] != '1') {
                    var msgId = 'KKAP-CM000-02E';
                    var target = 'kozaDel_' + (i + 1);
                    var value = undefined;
                    showErrorItemsGroup(
                        target,
                        AppBizCom.Msg.getMsg(msgId, ['受取口座の削除']),
                        msgId,
                        true
                    )
                    checkResult[1]['KOZA_DEL_FS'] = checkResult[1]['KOZA_DEL_FS'] || {};
                    checkResult[1]['KOZA_DEL_FS'][i] = { chkErr: true, chkResult: { value: value, msgId: [msgId] }};
                    errFlg = true;
                } else if ($scope.kozaModifyFlg[i] == '1' && $scope.kozaDel[i] == '1') {
                    checkResult[1]['KOZA_DEL_FS'] = checkResult[1]['KOZA_DEL_FS'] || {};
                    checkResult[1]['KOZA_DEL_FS'][i] = { chkErr: false, chkResult: { value: '1' }};
                }
            }
            if (errFlg) {
                return true;
            } else {
                return false;
            }
        };

        // 当社から送金する際のお受取口座チェック: 追加分のグループチェック（一括）
        var checkKozaAdds = function (checkResult){
            var errFlg = [];
            var define;
            var values;
            for (var i = 0; i < $scope.kozaAdd.KOZA.length; i++) {
                define = $scope.inputData.kozaAdd[i];
                values = $scope.kozaAdd.KOZA[i];
                if (!define) {
                    return [];
                }
                errFlg[i] = checkSpecItems(define, values, 'KOZA_ADD_FS', checkResult, i);
            }
            return errFlg;
        };

        // 当社から送金する際のお受取口座チェック: お受取口座選択規定値チェック（随時）
        var checkKozaCount = function(){

            // 銀行数・ゆうちょ数合計
            var kozaGinkoBefore = 0;
            var kozaYuchoBefore = 0;
            var kozaDelGinko = 0;
            var kozaDelYucho = 0;

            var kozaAddGinko = 0;
            var kozaAddYucho = 0;

            $scope.kozaBefore.KOZA.forEach((e, idx) => {
                if (e.KOZA_UKTRKZ == '1') {
                    kozaGinkoBefore = kozaGinkoBefore + 1;
                    $scope.kozaDel[idx] == '1' && (kozaDelGinko = kozaDelGinko + 1);
                }
                else if (e.KOZA_UKTRKZ == '0') {
                    kozaYuchoBefore = kozaYuchoBefore + 1;
                    $scope.kozaDel[idx] == '1' && (kozaDelYucho = kozaDelYucho + 1);
                }
            });

            $scope.kozaAdd.KOZA.forEach(e => {
                if (e.KOZA_UKTRKZ == '1' || e.KOZA_UKTRKZ == '3') {
                    kozaAddGinko = kozaAddGinko + 1;
                }
                else if (e.KOZA_UKTRKZ == '2') {
                    kozaAddYucho = kozaAddYucho + 1;
                }
            });

            $scope.kozaAdd.KOZA.forEach(e => {
                // エラークリア
                clearErrorGroup('radioKozaUktrkz_' + e.scopeId);
                    kozaGinkoBefore - kozaDelGinko + kozaAddGinko
                // （登録済み銀行数 + 登録済みゆうちょ数）－（削除銀行数 + 削除ゆうちょ数）が9行の場合エラー。
                if (((kozaGinkoBefore + kozaYuchoBefore) - (kozaDelGinko + kozaDelYucho) + kozaAddGinko + kozaAddYucho > 9)){
                    showMsgAndMakeChekResult(true, 'radioKozaUktrkz_' + e.scopeId, 'KKAP-SFJ06-21E', [], true);
                } else if(e.KOZA_UKTRKZ == '2' && kozaYuchoBefore - kozaDelYucho + kozaAddYucho > 1){
                    // ゆうちょ銀行を選択時、（登録済みゆうちょ数）－（削除ゆうちょ数）が1行の場合エラー。
                    showMsgAndMakeChekResult(true, 'radioKozaUktrkz_' + e.scopeId, 'KKAP-SFJ06-22E', [], true);
                }
            });
        };

        // 当社から送金する際のお受取口座チェック: お受取口座選択規定値チェック（一括）
        var checkKozaCountAllCheck = function(idx, scopeId){

            // 銀行数・ゆうちょ数合計
            var kozaGinkoBefore = 0;
            var kozaYuchoBefore = 0;
            var kozaDelGinko = 0;
            var kozaDelYucho = 0;

            var kozaAddGinko = 0;
            var kozaAddYucho = 0;

            $scope.kozaBefore.KOZA.forEach((e, id) => {
                if (e.KOZA_UKTRKZ == '1') {
                    kozaGinkoBefore = kozaGinkoBefore + 1;
                    $scope.kozaDel[id] == '1' && (kozaDelGinko = kozaDelGinko + 1);
                }
                else if (e.KOZA_UKTRKZ == '0') {
                    kozaYuchoBefore = kozaYuchoBefore + 1;
                    $scope.kozaDel[id] == '1' && (kozaDelYucho = kozaDelYucho + 1);
                }
            });

            $scope.kozaAdd.KOZA.forEach(e => {
                if (e.KOZA_UKTRKZ == '1' || e.KOZA_UKTRKZ == '3') {
                    kozaAddGinko = kozaAddGinko + 1;
                }
                else if (e.KOZA_UKTRKZ == '2') {
                    kozaAddYucho = kozaAddYucho + 1;
                }
            });

            var koza = $scope.kozaAdd.KOZA[idx];
            // エラークリア
            clearErrorGroup('radioKozaUktrkz_' + scopeId);

            // （登録済み銀行数 + 登録済みゆうちょ数）－（削除銀行数 + 削除ゆうちょ数）が9行の場合エラー。
            if (((kozaGinkoBefore + kozaYuchoBefore) - (kozaDelGinko + kozaDelYucho) + kozaAddGinko + kozaAddYucho > 9)){
                return {errId: 'KKAP-SFJ06-21E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-21E', [])};
            } else if(koza.KOZA_UKTRKZ == '2' && kozaYuchoBefore - kozaDelYucho + kozaAddYucho > 1){
                // ゆうちょ銀行を選択時、（登録済みゆうちょ数）－（削除ゆうちょ数）が1行の場合エラー。
                return {errId: 'KKAP-SFJ06-22E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-22E', [])};
            } else {
                return undefined;
            }
        };

        // 当社から送金する際のお受取口座チェック: 金融機関の必須チェック（一括）
        var checkKozaBkNm = function(idx, scopeId){
            var koza = $scope.kozaAdd.KOZA[idx];
            if (!checkExistError('radioKozaUktrkz_' + scopeId) && AppBizCom.InputCheck.isEmpty(koza.KOZA_BK_NM)){
                return {errId: 'KKAP-CM000-21E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-21E', ['金融機関', '金融機関名'])};
            } else {
                return undefined;
            }
        };

        // 当社から送金する際のお受取口座チェック: 支店の必須チェック（一括）
        var checkKozaBkMiseNm = function(idx, scopeId){
            var koza = $scope.kozaAdd.KOZA[idx];
            if (!checkExistError('radioKozaUktrkz_' + scopeId) && AppBizCom.InputCheck.isEmpty(koza.KOZA_BK_MISE_NM)){
                return {errId: 'KKAP-CM000-21E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-21E', ['支店', '支店名'])};
            } else {
                return undefined;
            }
        };

        // 当社から送金する際のお受取口座チェック: 預金種目必須チェック（一括）
        var checkKozaYoknkndAddBkIsEmpty = function(idx, scopeId){
            var koza = $scope.kozaAdd.KOZA[idx];
            if (!checkExistError('radioKozaUktrkz_' + scopeId) && AppBizCom.InputCheck.isEmpty(koza.KOZA_YOKNKND_ADD_BK)){
                return {errId: 'KKAP-CM000-02E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-02E', ['預金種目'])};
            } else {
                return undefined;
            }
        };

        // 当社から送金する際のお受取口座チェック: 口座番号の前0埋め処理（一括）
        var kozaNoPadLeft = function(idx, scopeId){
            var koza = $scope.kozaAdd.KOZA[idx];
            if (!AppBizCom.InputCheck.isEmpty(koza.KOZA_KOZA_CD_ADD_BK)) {
                $scope.kozaAdd.KOZA[idx].KOZA_KOZA_CD_ADD_BK = ("000000" + koza.KOZA_KOZA_CD_ADD_BK).slice(-7);
            }
        };

        // 当社から送金する際のお受取口座チェック: 口座番号必須チェック（一括）
        var checkKozaNoIsEmpty = function(idx, scopeId){
            var koza = $scope.kozaAdd.KOZA[idx];
            if (!checkExistError('radioKozaUktrkz_' + scopeId) && AppBizCom.InputCheck.isEmpty(koza.KOZA_KOZA_CD_ADD_BK)){
                return {errId: 'KKAP-CM000-01E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-01E', ['口座番号'])};
            } else {
                return undefined;
            }
        };

        // 当社から送金する際のお受取口座チェック: 口座番号属性チェック（一括、随時）
        var checkKozaNoIsNum = function(idx, scopeId){
            var tmpIdx;
            if ($scope.kozaAdd.KOZA[1] == undefined) {
                tmpIdx = 0;
            } else {
                if ($scope.kozaAdd.KOZA[idx].scopeId == scopeId) {
                    tmpIdx = idx;
                } else {
                    tmpIdx = Math.abs(idx - 1);
                }
            }
            var koza = $scope.kozaAdd.KOZA[tmpIdx];
            var kozaNoNotEmpty = !AppBizCom.InputCheck.isEmpty(koza.KOZA_KOZA_CD_ADD_BK);
            var kozaNoNotNum = !AppBizCom.InputCheck.isNum(String(koza.KOZA_KOZA_CD_ADD_BK));
            if (!checkExistError('radioKozaUktrkz_' + scopeId) && kozaNoNotEmpty && kozaNoNotNum){
                return {errId: 'KKAP-CM000-03E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-03E', ['口座番号', '数字'])};
            } else {
                return undefined;
            }
        };

        // 当社から送金する際のお受取口座チェック: 口座番号桁数一致チェック（一括）
        var checkKozaNoSamlength = function(idx, scopeId){
            var koza = $scope.kozaAdd.KOZA[idx];
            var kozaNoNotEmpty = !AppBizCom.InputCheck.isEmpty(koza.KOZA_KOZA_CD_ADD_BK);
            var kozaNoNotSameLength = AppBizCom.InputCheck.chkMaxLength(String(koza.KOZA_KOZA_CD_ADD_BK), 7) != 0;
            if (!checkExistError('radioKozaUktrkz_' + scopeId) && kozaNoNotEmpty && kozaNoNotSameLength){
                return {errId: 'KKAP-CM000-04E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-04E', ['口座番号', 7])};                
            } else {
                return undefined;
            }
        };

        // 当社から送金する際のお受取口座チェック: 口座番号規定値チェック（一括、随時）
        var checkKozaNo = function(idx, scopeId){
            var tmpIdx;
            if ($scope.kozaAdd.KOZA[1] == undefined) {
                tmpIdx = 0;
            } else {
                if ($scope.kozaAdd.KOZA[idx].scopeId == scopeId) {
                    tmpIdx = idx;
                } else {
                    tmpIdx = Math.abs(idx - 1);
                }
            }
            var koza = $scope.kozaAdd.KOZA[tmpIdx];
            if (!checkExistError('radioKozaUktrkz_' + scopeId) && koza.KOZA_KOZA_CD_ADD_BK == '0000000'){
                return showMsgAndMakeChekResult(false, 'txtKozaNumber_' + koza.scopeId, 'KKAP-SF015-04E', [], true); 
            }
        };

        // 当社から送金する際のお受取口座チェック: ゆうちょ銀行記号の前0埋め処理（一括）
        var yuchoKigoPadLeft = function(idx, scopeId){
            var koza = $scope.kozaAdd.KOZA[idx];
            if (!AppBizCom.InputCheck.isEmpty(koza.KOZA_BK_C_ADD_YUCH)) {
                $scope.kozaAdd.KOZA[idx].KOZA_BK_C_ADD_YUCH = ("0000" + koza.KOZA_BK_C_ADD_YUCH).slice(-5);
            }
        };

        // 当社から送金する際のお受取口座チェック: ゆうちょ銀行記号必須チェック（一括）
        var checkYuchoKigoIsEmpty = function(idx, scopeId){
            var koza = $scope.kozaAdd.KOZA[idx];
            if (!checkExistError('radioKozaUktrkz_' + scopeId) && AppBizCom.InputCheck.isEmpty(koza.KOZA_BK_C_ADD_YUCH)){
                return {errId: 'KKAP-CM000-01E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-01E', ['記号'])};
            } else {
                return undefined;
            }
        };

        // 当社から送金する際のお受取口座チェック: ゆうちょ銀行記号属性チェック（一括、随時）
        var checkYuchoKigoIsNum = function(idx, scopeId){
            var tmpIdx;
            if ($scope.kozaAdd.KOZA[1] == undefined) {
                tmpIdx = 0;
            } else {
                if ($scope.kozaAdd.KOZA[idx].scopeId == scopeId) {
                    tmpIdx = idx;
                } else {
                    tmpIdx = Math.abs(idx - 1);
                }
            }
            var koza = $scope.kozaAdd.KOZA[tmpIdx];
            var yuchoKigoNotEmpty = !AppBizCom.InputCheck.isEmpty(koza.KOZA_BK_C_ADD_YUCH);
            var yuchoKigoNotNum = !AppBizCom.InputCheck.isNum(String(koza.KOZA_BK_C_ADD_YUCH));
            if (!checkExistError('radioKozaUktrkz_' + scopeId) && yuchoKigoNotEmpty && yuchoKigoNotNum){
                return {errId: 'KKAP-CM000-03E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-03E', ['記号', '数字'])};
            } else {
                return undefined;
            }
        };

        // 当社から送金する際のお受取口座チェック: ゆうちょ銀行記号桁数一致チェック（一括）
        var checkYuchoKigoSamlength = function(idx, scopeId){
            var koza = $scope.kozaAdd.KOZA[idx];
            var yuchoKigoNotEmpty = !AppBizCom.InputCheck.isEmpty(koza.KOZA_BK_C_ADD_YUCH);
            var yuchoKigoNotSameLength = AppBizCom.InputCheck.chkMaxLength(String(koza.KOZA_BK_C_ADD_YUCH), 5) != 0;
            if (!checkExistError('radioKozaUktrkz_' + scopeId) && yuchoKigoNotEmpty && yuchoKigoNotSameLength){
                return {errId: 'KKAP-CM000-04E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-04E', ['記号', 5])};                
            } else {
                return undefined;
            }
        };

        // 当社から送金する際のお受取口座チェック: ゆうちょ銀行記号規定値チェック（一括、随時）
        var checkYuchoKigo = function(idx, scopeId){
            var tmpIdx;
            if ($scope.kozaAdd.KOZA[1] == undefined) {
                tmpIdx = 0;
            } else {
                if ($scope.kozaAdd.KOZA[idx].scopeId == scopeId) {
                    tmpIdx = idx;
                } else {
                    tmpIdx = Math.abs(idx - 1);
                }
            }
            var koza = $scope.kozaAdd.KOZA[tmpIdx];
            if (!checkExistError('radioKozaUktrkz_' + scopeId) && koza && koza.KOZA_BK_C_ADD_YUCH && !koza.KOZA_BK_C_ADD_YUCH.match(/^1(.*)(0)$/)){
                return showMsgAndMakeChekResult(false, 'txtYuchBkC_' + koza.scopeId, 'KKAP-SF015-02E', [], true);
            }
        };

        // 当社から送金する際のお受取口座チェック: ゆうちょ銀行通帳番号の前0埋め処理（一括）
        var yuchoNoPadLeft = function(idx, scopeId){
            var koza = $scope.kozaAdd.KOZA[idx];
            if (!AppBizCom.InputCheck.isEmpty(koza.YUCH_BK_KOZA_CD_ADD_YUCH)) {
                $scope.kozaAdd.KOZA[idx].YUCH_BK_KOZA_CD_ADD_YUCH = ("0000000" + koza.YUCH_BK_KOZA_CD_ADD_YUCH).slice(-8);
            }
        };

        // 当社から送金する際のお受取口座チェック: ゆうちょ銀行通帳番号必須チェック（一括）
        var checkYuchoNoIsEmpty = function(idx, scopeId){
            var koza = $scope.kozaAdd.KOZA[idx];
            if (!checkExistError('radioKozaUktrkz_' + scopeId) && AppBizCom.InputCheck.isEmpty(koza.YUCH_BK_KOZA_CD_ADD_YUCH)){
                return {errId: 'KKAP-CM000-01E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-01E', ['通帳番号'])};
            } else {
                return undefined;
            }
        };

        // 当社から送金する際のお受取口座チェック: ゆうちょ銀行通帳番号属性チェック（一括、随時）
        var checkYuchoNoIsNum = function(idx, scopeId){
            var tmpIdx;
            if ($scope.kozaAdd.KOZA[1] == undefined) {
                tmpIdx = 0;
            } else {
                if ($scope.kozaAdd.KOZA[idx].scopeId == scopeId) {
                    tmpIdx = idx;
                } else {
                    tmpIdx = Math.abs(idx - 1);
                }
            }
            var koza = $scope.kozaAdd.KOZA[tmpIdx];
            var yuchoNoNotEmpty = !AppBizCom.InputCheck.isEmpty(koza.YUCH_BK_KOZA_CD_ADD_YUCH);
            var yuchoNoNotNum = !AppBizCom.InputCheck.isNum(String(koza.YUCH_BK_KOZA_CD_ADD_YUCH));
            if (!checkExistError('radioKozaUktrkz_' + scopeId) && yuchoNoNotEmpty && yuchoNoNotNum){
                return {errId: 'KKAP-CM000-03E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-03E', ['通帳番号', '数字'])};
            } else {
                return undefined;
            }
        };

        // 当社から送金する際のお受取口座チェック: ゆうちょ銀行通帳番号桁数一致チェック（一括）
        var checkYuchoNoSamlength = function(idx, scopeId){
            var koza = $scope.kozaAdd.KOZA[idx];
            var yuchoNoNotEmpty = !AppBizCom.InputCheck.isEmpty(koza.YUCH_BK_KOZA_CD_ADD_YUCH);
            var yuchoNoNotSameLength = AppBizCom.InputCheck.chkMaxLength(String(koza.YUCH_BK_KOZA_CD_ADD_YUCH), 8) != 0;
            if (!checkExistError('radioKozaUktrkz_' + scopeId) && yuchoNoNotEmpty && yuchoNoNotSameLength){
                return {errId: 'KKAP-CM000-04E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-04E', ['通帳番号', 8])};                
            } else {
                return undefined;
            }
        };

        // 当社から送金する際のお受取口座チェック: ゆうちょ銀行通帳番号規定値チェック（一括、随時）
        var checkYuchoNo = function(idx, scopeId){
            var tmpIdx;
            if ($scope.kozaAdd.KOZA[1] == undefined) {
                tmpIdx = 0;
            } else {
                if ($scope.kozaAdd.KOZA[idx].scopeId == scopeId) {
                    tmpIdx = idx;
                } else {
                    tmpIdx = Math.abs(idx - 1);
                }
            }
            var koza = $scope.kozaAdd.KOZA[tmpIdx];
            if (!checkExistError('radioKozaUktrkz_' + scopeId) && koza && koza.YUCH_BK_KOZA_CD_ADD_YUCH && !koza.YUCH_BK_KOZA_CD_ADD_YUCH.match(/^.*(1)$/)){
                return showMsgAndMakeChekResult(false, 'txtYuchBkKozaCd_' + koza.scopeId, 'KKAP-SF015-03E', [], true);
            }
        };

        // 当社から送金する際のお受取口座チェック: 追加分の相関チェック1（一括）
        var checkKozaOther1 = function(checkResult){

            // 前提（登録済み銀行数 + 登録済みゆうちょ数）－（削除銀行数 + 削除ゆうちょ数）+ 追加銀行数 + 追加ゆうちょ数　が9行以内
            // 銀行数・ゆうちょ数合計
            var kozaGinkoBefore = 0;
            var kozaYuchoBefore = 0;
            var kozaDelGinko = 0;
            var kozaDelYucho = 0;
            var kozaAddGinko = 0;
            var kozaAddYucho = 0;
            $scope.kozaBefore.KOZA.forEach((e, idx) => {
                if (e.KOZA_UKTRKZ == '1') {
                    kozaGinkoBefore = kozaGinkoBefore + 1;
                    $scope.kozaDel[idx] == '1' && (kozaDelGinko = kozaDelGinko + 1);
                }
                else if (e.KOZA_UKTRKZ == '0') {
                    kozaYuchoBefore = kozaYuchoBefore + 1;
                    $scope.kozaDel[idx] == '1' && (kozaDelYucho = kozaDelYucho + 1);
                }
            });
            $scope.kozaAdd.KOZA.forEach(e => {
                if (e.KOZA_UKTRKZ == '1' || e.KOZA_UKTRKZ == '3') {
                    kozaAddGinko = kozaAddGinko + 1;
                }
                else if (e.KOZA_UKTRKZ == '2') {
                    kozaAddYucho = kozaAddYucho + 1;
                }
            });
            if ((kozaGinkoBefore + kozaYuchoBefore) - (kozaDelGinko + kozaDelYucho) + kozaAddGinko + kozaAddYucho > 9) {
                return false;
            }

            var errFlg = false;
            var addKozaLength = $scope.kozaAdd.KOZA.length;
            if (addKozaLength < 2) {
                return false;
            }
            var bkCnt = 0;
            var bkList = [];
            var ycCnt = 0;
            for (var i = 0; i < addKozaLength; i++) {
                if ($scope.kozaAdd.KOZA[i].KOZA_TORK_NO == '20') {
                    bkCnt++;
                    bkList.push($scope.kozaAdd.KOZA[i].KOZA_BK_NM + '-' + $scope.kozaAdd.KOZA[i].KOZA_BK_MISE_NM);
                } else {
                    ycCnt++;
                }
            }
            // ゆうちょ銀行以外の追加を2行選択されている場合エラー。
            if (bkCnt > 1) {
                for (var j = 0; j < bkCnt; j++) {
                    var msgId = 'KKAP-SFJ06-08E';
                    var target = 'KOZA_ADD_FS_' + j;
                    var value = bkList[j]; // 金融機関名
                    showErrorItemsGroup(
                        target,
                        AppBizCom.Msg.getMsg(msgId, []),
                        msgId,
                        true
                    )
                    checkResult[1]['KOZA_ADD_FS'] = checkResult[1]['KOZA_ADD_FS'] || {};
                    checkResult[1]['KOZA_ADD_FS'][j] = checkResult[1]['KOZA_ADD_FS'][j] || {};
                    checkResult[1]['KOZA_ADD_FS'][j][target] = { chkErr: true, chkResult: { value: value, msgId: [msgId] } };
                    errFlg = true;
                }
            }
            if (errFlg) {
                return true;
            }
            else {
                return false;
            }            
        };

        // 当社から送金する際のお受取口座チェック: 追加分の相関チェック2（一括）
        var checkKozaOther2 = function(checkResult, kozaAddErrFlg){
            var errFlg = false;
            var addKozaLength = $scope.kozaAdd.KOZA.length;
            var addBkKozaList = [];
            for (var i = 0; i < addKozaLength; i++) {
                var tmpKoza = $scope.kozaAdd.KOZA[i];
                if (tmpKoza.KOZA_TORK_NO == '20') { // 金融機関の場合
                    addBkKozaList[i] = tmpKoza.KOZA_BK_C_ADD_BK + tmpKoza.KOZA_MISE_C_ADD_BK + tmpKoza.KOZA_YOKNKND_ADD_BK + tmpKoza.KOZA_KOZA_CD_ADD_BK;
                }
            }
            // 新規登録重複の場合エラー
            var addSameKozaFlg = (addKozaLength == 2 && addBkKozaList[0] === addBkKozaList[1]) ? true : false;

            var beforeKozaLength = $scope.kozaBefore.KOZA.length;
            var beforeBkKozaList = [];
            for (var j = 0; j < beforeKozaLength; j++) {
                var tmpKoza = $scope.kozaBefore.KOZA[j];
                if (tmpKoza.KOZA_UKTRKZ == '1' && $scope.kozaDel[j] != '1') { // 金融機関の場合
                    beforeBkKozaList.push(tmpKoza.KOZA_BK_C + tmpKoza.KOZA_MISE_C + tmpKoza.BK_YOKNKND + tmpKoza.BK_KOZA_CD);
                }
            }
            // 既に登録済みである場合エラー。
            var isSameKozaFlg = false;
            for (var k = 0; k < addKozaLength; k++) {
                if(kozaAddErrFlg[k]){
                    continue;
                }
                // 重複ありの場合
                if (beforeBkKozaList.indexOf(addBkKozaList[k]) > -1) {
                    var msgId = 'KKAP-SFJ06-12E';
                    var target = 'KOZA_ADD_FS_' + k;
                    var value = addBkKozaList[k]; // 金融機関名
                    showErrorItemsGroup(
                        target,
                        AppBizCom.Msg.getMsg(msgId, []),
                        msgId,
                        true
                    )
                    checkResult[1]['KOZA_ADD_FS'] = checkResult[1]['KOZA_ADD_FS'] || {};
                    checkResult[1]['KOZA_ADD_FS'][k] = checkResult[1]['KOZA_ADD_FS'][k] || {};
                    checkResult[1]['KOZA_ADD_FS'][k][target] = { chkErr: true, chkResult: { value: value, msgId: [msgId] } };
                    errFlg = true;
                }
            }
            if (errFlg) {
                return true;
            }
            else {
                return false;
            }            
        };

        // 汎用チェック: 削除対象判定（汎用）
        var checkIsDelNo = function(AcNo) { // AcNo: 'xx'
            for (var i = 0; i < $scope.kozaDel.length; i++) {
                if ($scope.kozaDel[i] == '1' && $scope.kozaBefore.KOZA[i].KOZA_TRKNO == AcNo) {
                    return true;
                }
            }
            return false;
        };

        // 汎用チェック: 全て削除判定（汎用）
        var checkIsAllDel = function() {
            var cnt = 0;
            for (var i = 0; i < $scope.kozaDel.length; i++) {
                if ($scope.kozaDel[i] == '1') cnt++;
            }
            return (cnt == $scope.kozaDel.length) ? true : false;
        };

        // 汎用チェック: 新規登録なし判定（汎用）
        var checkIsNoAdd = function() {
            var cnt = 0;
            for (var i = 0; i < $scope.kozaAdd.KOZA.length; i++) {
                if (!AppBizCom.InputCheck.isEmpty($scope.kozaAdd.KOZA[i].KOZA_TORK_NO)) {
                    cnt++;
                }
            }
            return (cnt == 0) ? true : false;
        };

        // 汎用チェック: 口座名義人設定されている判定（汎用）
        var checkAcSetted = function(AcNo) { // AcNo: 'xx'
            for (var i = 0; i < $scope.kozaBefore.KOZA.length; i++) {
                if ($scope.kozaBefore.KOZA[i].KOZA_TRKNO == AcNo && !AppBizCom.InputCheck.isEmpty($scope.kozaBefore.KOZA[i].BK_KOZA_KANA)) {
                    return true;
                }
            }
            return false;
        };

        // 汎用チェック: 預金種目が貯蓄預金（既登録のみ）判定（汎用）
        var checkYksym = function(AcNo) { // AcNo: 'xx'
            for (var i = 0; i < $scope.kozaBefore.KOZA.length; i++) {
                if ($scope.kozaBefore.KOZA[i].KOZA_TRKNO == AcNo && $scope.kozaBefore.KOZA[i].BK_YOKNKND == '4') {
                    return true;
                }
            }
            return false;
        };

        // 汎用チェック: ゆうちょ銀行（新規もない）判定（汎用）
        var checkIsYuCyoAc = function(AcNo) { // AcNo: 'xx'
            for (var i = 0; i < $scope.kozaBefore.KOZA.length; i++) {
                if ($scope.kozaBefore.KOZA[i].KOZA_TRKNO == AcNo && $scope.kozaBefore.KOZA[i].KOZA_UKTRKZ == '0') {
                    return true;
                }
            }
            for (var j = 0; j < $scope.kozaAdd.KOZA.length; j++) { 
                if ($scope.kozaAdd.KOZA[j].KOZA_TORK_NO == AcNo && $scope.kozaAdd.KOZA[j].KOZA_TORK_NO == '30') {
                    return true;
                }
            }
            return false;
        };

        // 汎用チェック: 存在しない（新規もない）判定（汎用）
        var checkIsNoAc = function(AcNo) { // AcNo: 'xx'
            var cnt = 0;
            // 既存口座に存在しない
            for (var i = 0; i < $scope.kozaBefore.KOZA.length; i++) {
                if ($scope.kozaBefore.KOZA[i].KOZA_TRKNO == AcNo) {
                    cnt++;
                }
            }
            // 新規口座登録に存在しない
            for (var j = 0; j < $scope.kozaAdd.KOZA.length; j++) {
                var no = $scope.kozaAdd.KOZA[j].KOZA_TORK_NO;
                if (!AppBizCom.InputCheck.isEmpty(no) && no == AcNo) {
                    cnt++;
                }
            }
            if (cnt == 0) {
                return true;
            }
            return false;
        };

        // 利金・分配金支払方法（包括）チェック: 利金分配金が変更指定なしで、振込先指定（売却代金）の削除対象が、利金分配金（包括）で登録されている場合エラー。（一括）
        var checkIsDelSuknHoukatsu = function(checkResult) {
            if (AppBizCom.InputCheck.isEmpty($scope.suknBefore.SUKN_HOUKATSU)) {
                return undefined;
            }
            if ($scope.suknBefore.SUKN_HOUKATSU.slice(0, 6) != '登録銀行No') { // 「20:銀行振込出金」、「30:郵貯」の場合、「登録銀行No XX」で出力する。
                return undefined;
            }
            var suknHoukatsuBeforeNo = $scope.suknBefore.SUKN_HOUKATSU.slice(-2);
            if (checkIsDelNo(suknHoukatsuBeforeNo)) {
                var msgId = 'KKAP-SFJ06-20E';
                var target = 'SUKN_HKT_F_MAE';
                var value = $scope.suknBefore.SUKN_HOUKATSU;
                showErrorItemsGroup(
                    target,
                    AppBizCom.Msg.getMsg(msgId, []),
                    msgId,
                    true
                )
                checkResult1Update(target, value, msgId, checkResult);
                return true;
            }
            return false;
        };

        // 利金・分配金支払方法（包括）チェック: 利金・分配金支払方法（包括）の相関チェック（一括）
        var checkSuknHktAzkrWithNoAc = function() {
            var errFlg = false;
            if (AppBizCom.InputCheck.isEmpty($scope.suknBefore.SUKN_HOUKATSU)) {
                return undefined;
            }
            if ($scope.suknBefore.SUKN_HOUKATSU.slice(0, 2) != 'なし') {
                return undefined;
            }
            var suknHktAzkrSelected = $scope.suknHoukatsu.SUKN_HKT_AZKR;
            // 登録銀行"なし"の場合、預り金へ入金を選択された場合エラー。
            if (suknHktAzkrSelected == '1') {
                return {errId: 'KKAP-SFJ06-04E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-04E', ['預り金へ入金'])};
            } else {
                return undefined;
            }
        };

        // 利金・分配金支払方法（包括）チェック: 利金・分配金支払方法（包括）登録銀行No.の必須チェック（一括）
        var checkSuknHktTrknoIsEmpty = function() {
            var suknHktAzkrSelected = $scope.suknHoukatsu.SUKN_HKT_AZKR;
            if (suknHktAzkrSelected == '0' && AppBizCom.InputCheck.isEmpty($scope.suknHoukatsu.SUKN_HKT_TRKNO)){
                return {errId: 'KKAP-CM000-01E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-01E', ['登録銀行No.'])};
            } else {
                return undefined;
            }
        };

        // 利金・分配金支払方法（包括）チェック: 利金・分配金支払方法（包括）登録銀行No.の相関チェック1（一括）
        var checkSuknHktTrkno1 = function() {
            // 前提
            if ($scope.suknHoukatsu.SUKN_HKT_AZKR != '0') {
                return undefined;
            }
            // 入力された登録銀行No.が削除対象の場合エラー。
            if (!AppBizCom.InputCheck.isEmpty($scope.suknHoukatsu.SUKN_HKT_TRKNO) && checkIsDelNo($scope.suknHoukatsu.SUKN_HKT_TRKNO)) {
                return {errId: 'KKAP-SFJ06-14E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-14E', [])};
            } else {
                return undefined;
            }
        };

        // 利金・分配金支払方法（包括）チェック: 利金・分配金支払方法（包括）登録銀行No.の相関チェック2（一括）
        var checkSuknHktTrkno2 = function() {
            // 前提
            if ($scope.suknHoukatsu.SUKN_HKT_AZKR != '0') {
                return undefined;
            }
            // 入力された登録銀行No.が口座名銀人設定されている場合エラー。
            if (!AppBizCom.InputCheck.isEmpty($scope.suknHoukatsu.SUKN_HKT_TRKNO) && checkAcSetted($scope.suknHoukatsu.SUKN_HKT_TRKNO)) {
                return {errId: 'KKAP-SFJ06-15E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-15E', [])};
            } else {
                return undefined;
            }
        };

        // 利金・分配金支払方法（包括）チェック: 利金・分配金支払方法（包括）登録銀行No.の相関チェック3（一括）
        var checkSuknHktTrkno3 = function() {
            // 前提
            if ($scope.suknHoukatsu.SUKN_HKT_AZKR != '0') {
                return undefined;
            }
            // 入力された登録銀行No.の預金種目が貯蓄預金の場合エラー。
            if (!AppBizCom.InputCheck.isEmpty($scope.suknHoukatsu.SUKN_HKT_TRKNO) && checkYksym($scope.suknHoukatsu.SUKN_HKT_TRKNO)) {
                return {errId: 'KKAP-SFJ06-17E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-17E', [])};
            } else {
                return undefined;
            }
        };

        // 利金・分配金支払方法（包括）チェック: 利金・分配金支払方法（包括）登録銀行No.の相関チェック4（一括）
        // 入力された登録銀行No.のゆうちょ銀行の場合エラー。（当該チェックを削除）

        // 利金・分配金支払方法（包括）チェック: 利金・分配金支払方法（包括）登録銀行No.の相関チェック5（一括）
        var checkSuknHktTrkno5 = function() {
            // 前提
            if ($scope.suknHoukatsu.SUKN_HKT_AZKR != '0') {
                return undefined;
            }
            // 入力された登録銀行No.が存在しない（新規登録でもない）場合エラー。
            if (!AppBizCom.InputCheck.isEmpty($scope.suknHoukatsu.SUKN_HKT_TRKNO) && checkIsNoAc($scope.suknHoukatsu.SUKN_HKT_TRKNO)) {
                return {errId: 'KKAP-SFJ06-19E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-19E', [])};
            } else {
                return undefined;
            }
        };

        // 利金・分配金支払方法（包括）チェック: 利金・分配金支払方法（銘柄）との相関チェック（一括）
        var checkSuknHktTrkno7 = function() {
            // 前提
            // 「利金・分配金支払方法（銘柄）」に個別銘柄指定がない場合は、チェック不要
            if ($scope.suknBefore.SUKN_SITEI_K != '1' && $scope.suknBefore.SUKN_SITEI_K != '3') {
                return undefined;
            }
            if (AppBizCom.InputCheck.isEmpty($scope.suknBefore.SUKN_HOUKATSU)) {
                return undefined;
            }
            if ($scope.suknBefore.SUKN_HOUKATSU.slice(0, 2) != 'なし') {
                return undefined;
            }
            if ($scope.suknHoukatsu.SUKN_HKT_AZKR != '0') {
                return undefined;
            }

            // 利金・分配金支払方法（包括）入力済み、利金・分配金支払方法（銘柄）未入力の場合エラー。
            if (!AppBizCom.InputCheck.isEmpty($scope.suknHoukatsu.SUKN_HKT_TRKNO) && AppBizCom.InputCheck.isEmpty($scope.suknMeigara.SUKN_HKT_MEIG_K)) {
                return {errId: 'KKAP-CM000-02E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-02E', ['利金・分配金支払方法（銘柄）'])};
            } else {
                return undefined;
            }
        };

        // 利金・分配金支払方法（銘柄）チェック: 利金・分配金支払方法（包括）との相関チェック（一括）
        var checkSuknHktMeigk = function() {
            // 利金・分配金支払方法（銘柄）入力済み、利金・分配金支払方法（包括）未入力の場合エラー。
            if (AppBizCom.InputCheck.isEmpty($scope.suknHoukatsu.SUKN_HKT_AZKR)) {
                return {errId: 'KKAP-CM000-02E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-02E', ['利金・分配金支払方法（包括）'])};
            } else {
                return undefined;
            }
        };

        // 外国証券の円貨利金分配金振込銀行チェック：外国証券の円貨利金分配金振込銀行の相関チェック（一括）
        var checkGaikSyknYenSuknAzkrNasi = function() {
            // 外証包括 かつ 外証銘柄なし の場合、選択したらエラー。
            var gaikSyknYenSuknBkHktBeforeIsNasi = ($scope.gaikSunkBefore.GAIK_SYKN_YEN_SUKN_BK_HKT == stringConst.Nasi) ? true : false;
            var gaikSyknYenSuknBkMeigBeforeIsNasi = ($scope.gaikSunkBefore.GAIK_SYKN_YEN_SUKN_BK_MEIG_NASI) ? true : false;
            var gaikSuknYenSuknAzkrNotEmpty = !AppBizCom.InputCheck.isEmpty($scope.gaikSukn.GAIK_SYKN_YEN_SUKN_AZKR);
            if (gaikSyknYenSuknBkHktBeforeIsNasi && gaikSyknYenSuknBkMeigBeforeIsNasi && gaikSuknYenSuknAzkrNotEmpty) {
                return {errId: 'KKAP-SFJ06-04E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-04E', ['登録銀行なしの場合'])};
            } else {
                return undefined;
            }
        };
        
        // 外国証券の円貨利金分配金振込銀行チェック：銘柄／受取口座1（一括）
        var checkGaikSyknYenF = function(checkResult) {
            // 外証の円貨利金分配金振込銀行（包括）
            var gaikSyknYenSuknBkHkt = $scope.gaikSunkBefore.GAIK_SYKN_YEN_SUKN_BK_HKT.slice(-2);
            // 外証の円貨利金分配金振込銀行（銘柄）
            var gaikSyknYenSuknBkMeig = $scope.gaikSunkBefore.GAIK_SYKN_YEN_SUKN_BK_MEIG;
            // 振込先口座削除フラグ
            var kozaDelFlg = $scope.kozaDel;
            // 振込先口座
            var koza = $scope.kozaBefore.KOZA;

            var deleteKoza = koza.filter(function(val, index){
                return kozaDelFlg[index] == '1' && (val.KOZA_TRKNO == gaikSyknYenSuknBkHkt || gaikSyknYenSuknBkMeig.some(function(tar){ return tar.GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA == val.KOZA_TRKNO }));
            });

            // 外証の円貨利金分配金振込銀行が変更指定なしで、振込先指定（売却代金）の削除対象が、外証の円貨利金分配金振込銀行で登録されている場合エラー。
            if (deleteKoza.length > 0) {
                var msgId = 'KKAP-SFJ06-20E';
                var target = 'GAIK_SYKN_YEN_F_MAE';
                var value = undefined;
                showErrorItemsGroup(
                    target,
                    AppBizCom.Msg.getMsg(msgId, []),
                    msgId,
                    true
                )
                checkResult1Update(target, value, msgId, checkResult);
                return true;
            } else {
                return false;
            }
        };

        // 外国証券の円貨利金分配金振込銀行チェック：支払方法選択（外証） 削除する（受取口座）[X] 相関チェックエラー
        var checkGaikSyknYenSuknAzkr = function(checkResult){

            if (AppBizCom.InputCheck.isEmpty($scope.gaikSukn.GAIK_SYKN_YEN_SUKN_AZKR)) {
                return false;
            }

            // 振込先口座
            var koza = $scope.kozaBefore.KOZA;
            // 振込先口座削除フラグ
            var kozaDelFlg = $scope.kozaDel;

            var deleteKoza = koza.filter(function(val, index){
                return kozaDelFlg[index] == '1';
            });

            // 外国証券支払方法を選択時、お受取口座で削除選択(ゆうちょも含む)されていない場合エラー。
            if (deleteKoza.length == 0){
                var msgId = 'KKAP-SFJ06-04E';
                var target = 'radioGaikSukn';
                var value = $scope.gaikSukn.GAIK_SYKN_YEN_SUKN_AZKR;
                showErrorItemsGroup(
                    target,
                    AppBizCom.Msg.getMsg(msgId, ['支払方法']),
                    msgId,
                    true
                )
                checkResult1Update(target, value, msgId, checkResult);
                return true;
            } else {
                return false;
            }
        };

        var maeCheckGaikSyknYenSuknAzkr = function(){

            if (AppBizCom.InputCheck.isEmpty($scope.gaikSukn.GAIK_SYKN_YEN_SUKN_AZKR)) {
                return false;
            }

            // 振込先口座
            var koza = $scope.kozaBefore.KOZA;
            // 振込先口座削除フラグ
            var kozaDelFlg = $scope.kozaDel;

            var deleteKoza = koza.filter(function(val, index){
                return kozaDelFlg[index] == '1';
            });

            // 外国証券支払方法を選択時、お受取口座で削除選択(ゆうちょも含む)されていない場合エラー。
            if (deleteKoza.length == 0){
                return true;
            } else {
                return false;
            }
        };

        // 外国証券の円貨利金分配金振込銀行チェック：登録銀行No.の必須チェック（一括）
        var checkGaikSyknYenSuknBkIsEmpty = function() {
            var maeChk = maeCheckGaikSyknYenSuknAzkr();
            if (maeChk) {
                return false;
            }
            var gaikSyknYenSuknAzSelected = $scope.gaikSukn.GAIK_SYKN_YEN_SUKN_AZKR;
            if (gaikSyknYenSuknAzSelected == '0' && AppBizCom.InputCheck.isEmpty($scope.gaikSukn.GAIK_SYKN_YEN_SUKN_BK)){
                return {errId: 'KKAP-CM000-01E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-01E', ['登録銀行No.'])};
            } else {
                return undefined;
            }
        };

        // 外国証券の円貨利金分配金振込銀行チェック：登録銀行No.の相関チェック1（一括）
        var checkGaikSyknYenSuknBk1 = function() {
            // 前提
            var maeChk = maeCheckGaikSyknYenSuknAzkr();
            if (maeChk) {
                return false;
            }
            if ($scope.gaikSukn.GAIK_SYKN_YEN_SUKN_AZKR != '0') {
                return undefined;
            }
            // 入力された登録銀行No.が削除対象の場合エラー。
            if (!AppBizCom.InputCheck.isEmpty($scope.gaikSukn.GAIK_SYKN_YEN_SUKN_BK) && checkIsDelNo($scope.gaikSukn.GAIK_SYKN_YEN_SUKN_BK)) {
                return {errId: 'KKAP-SFJ06-14E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-14E', [])};
            } else {
                return undefined;
            }
        };

        // 外国証券の円貨利金分配金振込銀行チェック：登録銀行No.の相関チェック2（一括）
        var checkGaikSyknYenSuknBk2 = function() {
            // 前提
            var maeChk = maeCheckGaikSyknYenSuknAzkr();
            if (maeChk) {
                return false;
            }
            if ($scope.gaikSukn.GAIK_SYKN_YEN_SUKN_AZKR != '0') {
                return undefined;
            }
            // 入力された登録銀行No.が口座名銀人設定されている場合エラー。
            if (!AppBizCom.InputCheck.isEmpty($scope.gaikSukn.GAIK_SYKN_YEN_SUKN_BK) && checkAcSetted($scope.gaikSukn.GAIK_SYKN_YEN_SUKN_BK)) {
                return {errId: 'KKAP-SFJ06-15E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-15E', [])};
            } else {
                return undefined;
            }
        };

        // 外国証券の円貨利金分配金振込銀行チェック：登録銀行No.の相関チェック3（一括）
        var checkGaikSyknYenSuknBk3 = function() {
            // 前提
            var maeChk = maeCheckGaikSyknYenSuknAzkr();
            if (maeChk) {
                return false;
            }
            if ($scope.gaikSukn.GAIK_SYKN_YEN_SUKN_AZKR != '0') {
                return undefined;
            }
            // 入力された登録銀行No.の預金種目が貯蓄預金の場合エラー。
            if (!AppBizCom.InputCheck.isEmpty($scope.gaikSukn.GAIK_SYKN_YEN_SUKN_BK) && checkYksym($scope.gaikSukn.GAIK_SYKN_YEN_SUKN_BK)) {
                return {errId: 'KKAP-SFJ06-17E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-17E', [])};
            } else {
                return undefined;
            }
        };

        // 外国証券の円貨利金分配金振込銀行チェック：登録銀行No.の相関チェック4（一括）
        var checkGaikSyknYenSuknBk4 = function() {
            // 前提
            var maeChk = maeCheckGaikSyknYenSuknAzkr();
            if (maeChk) {
                return false;
            }
            if ($scope.gaikSukn.GAIK_SYKN_YEN_SUKN_AZKR != '0') {
                return undefined;
            }
            // 入力された登録銀行No.のゆうちょ銀行の場合エラー。
            if (!AppBizCom.InputCheck.isEmpty($scope.gaikSukn.GAIK_SYKN_YEN_SUKN_BK) && checkIsYuCyoAc($scope.gaikSukn.GAIK_SYKN_YEN_SUKN_BK)) {
                return {errId: 'KKAP-SFJ06-18E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-18E', [])};
            } else {
                return undefined;
            }
        };

        // 外国証券の円貨利金分配金振込銀行チェック：登録銀行No.の相関チェック5（一括）
        var checkGaikSyknYenSuknBk5 = function() {
            // 前提
            var maeChk = maeCheckGaikSyknYenSuknAzkr();
            if (maeChk) {
                return false;
            }
            if ($scope.gaikSukn.GAIK_SYKN_YEN_SUKN_AZKR != '0') {
                return undefined;
            }
            // 入力された登録銀行No.が存在しない（新規登録でもない）場合エラー。
            if (!AppBizCom.InputCheck.isEmpty($scope.gaikSukn.GAIK_SYKN_YEN_SUKN_BK) && checkIsNoAc($scope.gaikSukn.GAIK_SYKN_YEN_SUKN_BK)) {
                return {errId: 'KKAP-SFJ06-19E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-19E', [])};
            } else {
                return undefined;
            }
        };

        // 累投（株投型）分配金買付停止チェック: 「当社から送金する際のお受取口座」の”削除入力”が行われた場合、「累投(株投型)分配金買付停止」の入力を必須とする（一括）
        var checkRuitouSuknKaitTeiBefore = function(checkResult) {
            // 振込先口座
            var koza = $scope.kozaBefore.KOZA;
            // 振込先口座削除フラグ
            var kozaDelFlg = $scope.kozaDel;

            var deleteKoza = koza.filter(function(val, index){
                return kozaDelFlg[index] == '1' && '0' != val.KOZA_UKTRKZ;
            });

            if (deleteKoza.length == 0) {
                return false;
            }

            if (AppBizCom.InputCheck.isEmpty($scope.ruiTouSunk.RUITOU_SUKN_KAIT_TEIS_K)) {
                var msgId = 'KKAP-CM000-02E';
                var target = 'RUITOU_SUKN_KAIT_TEIS_F_MAE';
                var value = $scope.ruiTouSunk.RUITOU_SUKN_KAIT_TEIS_F_MAE;
                showErrorItemsGroup(
                    target,
                    AppBizCom.Msg.getMsg(msgId, ['累投（株投型）分配金買付停止']),
                    msgId,
                    true
                )
                checkResult1Update(target, value, msgId, checkResult);
                return true;
            } else {
                return false;
            }
        };

        // 累投（株投型）分配金買付停止チェック: 累投（株投型）分配金買付停止の相関チェック（一括）
        var checkRuitouSuknKaitTeisk = function() {
            var ruitouSuknKaitTeiskNotEmpty = !AppBizCom.InputCheck.isEmpty($scope.ruiTouSunk.RUITOU_SUKN_KAIT_TEIS_K);
            var cnt = 0;
            for (var i = 0; i < $scope.kozaBefore.KOZA.length; i++) {
                if ($scope.kozaDel[i] == '1' && $scope.kozaBefore.KOZA[i].KOZA_UKTRKZ == '1') {
                    cnt++;
                }
            }
            var kozaBankNoDel = (cnt == 0) ? true : false;
            // 累投（株投型）分配金買付停止を選択時、お受取口座で削除選択(ゆうちょ以外)されていない場合エラー。
            if (ruitouSuknKaitTeiskNotEmpty && kozaBankNoDel){
                return {errId: 'KKAP-SFJ06-04E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-04E', ['支払方法'])};
            } else {
                return undefined;
            }
        };

        var maeCheckRuitouSuknKaitTeisk = function() {
            var ruitouSuknKaitTeiskNotEmpty = !AppBizCom.InputCheck.isEmpty($scope.ruiTouSunk.RUITOU_SUKN_KAIT_TEIS_K);
            var cnt = 0;
            for (var i = 0; i < $scope.kozaBefore.KOZA.length; i++) {
                if ($scope.kozaDel[i] == '1' && $scope.kozaBefore.KOZA[i].KOZA_UKTRKZ == '1') {
                    cnt++;
                }
            }
            var kozaBankNoDel = (cnt == 0) ? true : false;
            // 累投（株投型）分配金買付停止を選択時、お受取口座で削除選択(ゆうちょ以外)されていない場合エラー。
            if (ruitouSuknKaitTeiskNotEmpty && kozaBankNoDel){
                return true;
            } else {
                return false;
            }
        };

        // 累投（株投型）分配金買付停止チェック: 累投（株投型）分配金買付停止登録銀行No.の必須チェック（一括）
        var checkRuitouSuknTrknoIsEmpty = function() {
            var maeChk = maeCheckRuitouSuknKaitTeisk();
            if (maeChk) {
                return false;
            }
            var ruitouSuknKaitTeiskSelected = $scope.ruiTouSunk.RUITOU_SUKN_KAIT_TEIS_K;
            if (ruitouSuknKaitTeiskSelected == '3' && AppBizCom.InputCheck.isEmpty($scope.ruiTouSunk.RUITOU_SUKN_TRKNO)){
                return {errId: 'KKAP-CM000-01E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-01E', ['登録銀行No.'])};
            } else {
                return undefined;
            }
        };

        // 累投（株投型）分配金買付停止チェック: 累投（株投型）分配金買付停止登録銀行No.の相関チェック1（一括）
        var checkRuitouSuknTrkno1 = function() {
            // 前提
            var maeChk = maeCheckRuitouSuknKaitTeisk();
            if (maeChk) {
                return false;
            }
            if ($scope.ruiTouSunk.RUITOU_SUKN_KAIT_TEIS_K != '3') {
                return undefined;
            }
            // 入力された登録銀行No.が削除対象の場合エラー。
            if (!AppBizCom.InputCheck.isEmpty($scope.ruiTouSunk.RUITOU_SUKN_TRKNO) && checkIsDelNo($scope.ruiTouSunk.RUITOU_SUKN_TRKNO)) {
                return {errId: 'KKAP-SFJ06-14E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-14E', [])};
            } else {
                return undefined;
            }
        };

        // 累投（株投型）分配金買付停止チェック: 累投（株投型）分配金買付停止登録銀行No.の相関チェック2（一括）
        var checkRuitouSuknTrkno2 = function() {
            // 前提
            var maeChk = maeCheckRuitouSuknKaitTeisk();
            if (maeChk) {
                return false;
            }
            if ($scope.ruiTouSunk.RUITOU_SUKN_KAIT_TEIS_K != '3') {
                return undefined;
            }
            // 入力された登録銀行No.が口座名銀人設定されている場合エラー。
            if (!AppBizCom.InputCheck.isEmpty($scope.ruiTouSunk.RUITOU_SUKN_TRKNO) && checkAcSetted($scope.ruiTouSunk.RUITOU_SUKN_TRKNO)) {
                return {errId: 'KKAP-SFJ06-15E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-15E', [])};
            } else {
                return undefined;
            }
        };

        // 累投（株投型）分配金買付停止チェック: 累投（株投型）分配金買付停止登録銀行No.の相関チェック3（一括）
        var checkRuitouSuknTrkno3 = function() {
            // 前提
            var maeChk = maeCheckRuitouSuknKaitTeisk();
            if (maeChk) {
                return false;
            }
            if ($scope.ruiTouSunk.RUITOU_SUKN_KAIT_TEIS_K != '3') {
                return undefined;
            }
            // 入力された登録銀行No.の預金種目が貯蓄預金の場合エラー。
            if (!AppBizCom.InputCheck.isEmpty($scope.ruiTouSunk.RUITOU_SUKN_TRKNO) && checkYksym($scope.ruiTouSunk.RUITOU_SUKN_TRKNO)) {
                return {errId: 'KKAP-SFJ06-17E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-17E', [])};
            } else {
                return undefined;
            }
        };

        // 累投（株投型）分配金買付停止チェック: 累投（株投型）分配金買付停止登録銀行No.の相関チェック4（一括）
        var checkRuitouSuknTrkno4 = function() {
            // 前提
            var maeChk = maeCheckRuitouSuknKaitTeisk();
            if (maeChk) {
                return false;
            }
            if ($scope.ruiTouSunk.RUITOU_SUKN_KAIT_TEIS_K != '3') {
                return undefined;
            }
            // 入力された登録銀行No.のゆうちょ銀行の場合エラー。
            if (!AppBizCom.InputCheck.isEmpty($scope.ruiTouSunk.RUITOU_SUKN_TRKNO) && checkIsYuCyoAc($scope.ruiTouSunk.RUITOU_SUKN_TRKNO)) {
                return {errId: 'KKAP-SFJ06-18E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-18E', [])};
            } else {
                return undefined;
            }
        };

        // 累投（株投型）分配金買付停止チェック: 累投（株投型）分配金買付停止登録銀行No.の相関チェック5（一括）
        var checkRuitouSuknTrkno5 = function() {
            // 前提
            var maeChk = maeCheckRuitouSuknKaitTeisk();
            if (maeChk) {
                return false;
            }
            if ($scope.ruiTouSunk.RUITOU_SUKN_KAIT_TEIS_K != '3') {
                return undefined;
            }
            // 入力された登録銀行No.が存在しない（新規登録でもない）場合エラー。
            if (!AppBizCom.InputCheck.isEmpty($scope.ruiTouSunk.RUITOU_SUKN_TRKNO) && checkIsNoAc($scope.ruiTouSunk.RUITOU_SUKN_TRKNO)) {
                return {errId: 'KKAP-SFJ06-19E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-19E', [])};
            } else {
                return undefined;
            }
        };

        // 配当金受領方式チェック: 既に登録配当金受領口座形式で(変更なし)、登録銀行Noの削除が行われ､登録銀行Noの入力がない場合エラー。（一括）
        var checkIsDelHaitknSykn = function(checkResult) {
            if (AppBizCom.InputCheck.isEmpty($scope.haitkinSunkBefore.HAITKIN)) {
                return undefined;
            }
            if ($scope.haitkinSunkBefore.HAITKIN.slice(0, 10) != '全銘柄振込先指定方式') {
                return undefined;
            }
            var haitknSyknBeforeNo = $scope.haitkinSunkBefore.HAITKIN.slice(-2);
            if (checkIsDelNo(haitknSyknBeforeNo)) {
                var msgId = 'KKAP-SFJ06-20E';
                var target = 'HAITKN_SYKN_UKTR_F_MAE';
                var value = $scope.haitkinSunkBefore.HAITKIN;
                showErrorItemsGroup(
                    target,
                    AppBizCom.Msg.getMsg(msgId, []),
                    msgId,
                    true
                )
                checkResult1Update(target, value, msgId, checkResult);
                return true;
            }
            return false;
        };

        // 配当金受領方式チェック: 配当金受領方式申込の相関チェック（一括）
        var checkHaitknSyknUktrMskm = function() {
            var haitknSyknUktrMskmSelected = $scope.haitkinSunk.HAITKN_SYKN_UKTR_MSKM;
            var haitknSyknBefore = $scope.haitkinSunkBefore.HAITKIN;
            if (AppBizCom.InputCheck.isEmpty(haitknSyknBefore)) {
                return undefined;
            }
            if (haitknSyknBefore == '指定なし' && (haitknSyknUktrMskmSelected == '2' || haitknSyknUktrMskmSelected == '3')) {
                // ① 配当金受領証方式を契約時(指定なし)、変更[2]が選択された場合エラー。
                // ② 配当金受領証方式を契約時(指定なし)、抹消[3]が選択された場合エラー。
                return {errId: 'KKAP-SFJ06-02E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-02E', ['申込区分'])};
            } else if ((haitknSyknBefore == '株式数比例配分方式' || haitknSyknBefore.slice(0, 10) == '全銘柄振込先指定方式') && haitknSyknUktrMskmSelected == '1') {
                // ① 株式数比例配分方式を契約時、申込[1]が選択された場合エラー。
                // ② 登録配当金受領方式を契約時、申込[1]が選択された場合エラー。
                return {errId: 'KKAP-SFJ06-01E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-01E', ['申込区分'])};
            } else {
                return undefined;
            }
        };

        // 配当金受領方式チェック: 受取方法の必須チェック（一括）
        var checkAmeigFurikomiChkIsEmpty = function() {
            var haitknSyknUktrMskmSelected = $scope.haitkinSunk.HAITKN_SYKN_UKTR_MSKM;
            var ameigFurikomiChkIsEmpty = AppBizCom.InputCheck.isEmpty($scope.haitkinSunk.AMEIG_FURIKOMI_CHK);
            if (!checkExistError('radioHaitkinSunk') && (haitknSyknUktrMskmSelected == '1' || haitknSyknUktrMskmSelected == '2') && ameigFurikomiChkIsEmpty) {
                // 受取方法が選択されていない場合エラー。
                // ⇒契約済み状態の判定は不要。受取方法は申込み・変更時には必須で抹消時は不要｡抹消時は入力エリアを非表示とする。
                return {errId: 'KKAP-CM000-02E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-02E', ['受取方法'])};
            } else {
                return undefined;
            }
        };

        // 配当金受領方式チェック: 配当金受領方式申込登録銀行No.の必須チェック（一括）
        var checkAmeigFurikomiIsEmpty = function() {
            var haitknSyknUktrMskmSelected = $scope.haitkinSunk.HAITKN_SYKN_UKTR_MSKM;
            var ameigFurikomiChkSelected = $scope.haitkinSunk.AMEIG_FURIKOMI_CHK;
            var ameigFurikomiIsEmpty = AppBizCom.InputCheck.isEmpty($scope.haitkinSunk.AMEIG_FURIKOMI);
            if (!checkExistError('radioHaitkinSunk') && haitknSyknUktrMskmSelected != '3' && ameigFurikomiChkSelected == '1' && ameigFurikomiIsEmpty){
                return {errId: 'KKAP-CM000-01E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-01E', ['登録銀行No.'])};
            } else {
                return undefined;
            }
        };

        // 配当金受領方式チェック: 配当金受領方式申込登録銀行No.の属性チェック（一括、随時）
        var checkAmeigFurikomiIsNum = function() {
            var ameigFurikomiChkSelected = $scope.haitkinSunk.AMEIG_FURIKOMI_CHK;
            var ameigFurikomiNotEmpty = !AppBizCom.InputCheck.isEmpty($scope.haitkinSunk.AMEIG_FURIKOMI);
            var ameigFurikomiNotNum = !AppBizCom.InputCheck.isNum(String($scope.haitkinSunk.AMEIG_FURIKOMI));
            if (!checkExistError('radioHaitkinSunk') && ameigFurikomiChkSelected == '1' && ameigFurikomiNotEmpty && ameigFurikomiNotNum){
                return {errId: 'KKAP-CM000-03E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-03E', ['登録銀行No.', '数字'])};
            } else {
                return undefined;
            }
        };
        
        // 配当金受領方式チェック: 配当金受領方式申込登録銀行No.の桁数一致チェック（一括）
        var checkAmeigFurikomiSameLength = function() {
            var ameigFurikomiChkSelected = $scope.haitkinSunk.AMEIG_FURIKOMI_CHK;
            var ameigFurikomiNotEmpty = !AppBizCom.InputCheck.isEmpty($scope.haitkinSunk.AMEIG_FURIKOMI);
            var ameigFurikomiNotSameLength = AppBizCom.InputCheck.chkMaxLength(String($scope.haitkinSunk.AMEIG_FURIKOMI), 2) != 0;
            if (!checkExistError('radioHaitkinSunk') && ameigFurikomiChkSelected == '1' && ameigFurikomiNotEmpty && ameigFurikomiNotSameLength){
                return {errId: 'KKAP-CM000-04E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-04E', ['登録銀行No.', 2])};
            } else {
                return undefined;
            }
        };

        // 配当金受領方式チェック: 配当金受領方式申込登録銀行No.の相関必須チェック（一括）
        var checkAmeigFurikomiIsAllowed = function() {
            var haitknSyknUktrMskmSelected = $scope.haitkinSunk.HAITKN_SYKN_UKTR_MSKM;
            var ameigFurikomiChkIsEmpty = AppBizCom.InputCheck.isEmpty($scope.haitkinSunk.AMEIG_FURIKOMI_CHK);
            var ameigFurikomiNotEmpty = !AppBizCom.InputCheck.isEmpty($scope.haitkinSunk.AMEIG_FURIKOMI);
            if (!checkExistError('radioHaitkinSunk') && haitknSyknUktrMskmSelected != '3' && ameigFurikomiChkIsEmpty && ameigFurikomiNotEmpty){
                return {errId: 'KKAP-CM000-20E', errMsg: AppBizCom.Msg.getMsg('KKAP-CM000-20E', ['登録銀行No.'])};
            } else {
                return undefined;
            }
        };

        // 配当金受領方式チェック: 配当金受領方式申込登録銀行No.の相関チェック1（一括）
        var checkAmeigFurikomi1 = function() {
            // 前提
            if ($scope.haitkinSunk.HAITKN_SYKN_UKTR_MSKM == '3' || $scope.haitkinSunk.AMEIG_FURIKOMI_CHK != '1') {
                return undefined;
            }
            // 入力された登録銀行No.が削除対象の場合エラー。
            if (!checkExistError('radioHaitkinSunk') && !AppBizCom.InputCheck.isEmpty($scope.haitkinSunk.AMEIG_FURIKOMI) && checkIsDelNo($scope.haitkinSunk.AMEIG_FURIKOMI)) {
                return {errId: 'KKAP-SFJ06-14E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-14E', [])};
            } else {
                return undefined;
            }
        };

        // 配当金受領方式チェック: 配当金受領方式申込登録銀行No.の相関チェック2（一括）
        var checkAmeigFurikomi2 = function() {
            // 前提
            if ($scope.haitkinSunk.HAITKN_SYKN_UKTR_MSKM == '3' || $scope.haitkinSunk.AMEIG_FURIKOMI_CHK != '1') {
                return undefined;
            }
            // 入力された登録銀行No.が口座名銀人設定されている場合エラー。
            if (!checkExistError('radioHaitkinSunk') && !AppBizCom.InputCheck.isEmpty($scope.haitkinSunk.AMEIG_FURIKOMI) && checkAcSetted($scope.haitkinSunk.AMEIG_FURIKOMI)) {
                return {errId: 'KKAP-SFJ06-15E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-15E', [])};
            } else {
                return undefined;
            }
        };

        // 配当金受領方式チェック: 配当金受領方式申込登録銀行No.の相関チェック3（一括）
        var checkAmeigFurikomi3 = function() {
            // 前提
            if ($scope.haitkinSunk.HAITKN_SYKN_UKTR_MSKM == '3' || $scope.haitkinSunk.AMEIG_FURIKOMI_CHK != '1') {
                return undefined;
            }
            // 入力された登録銀行No.の預金種目が貯蓄預金の場合エラー。
            if (!checkExistError('radioHaitkinSunk') && !AppBizCom.InputCheck.isEmpty($scope.haitkinSunk.AMEIG_FURIKOMI) && checkYksym($scope.haitkinSunk.AMEIG_FURIKOMI)) {
                return {errId: 'KKAP-SFJ06-17E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-17E', [])};
            } else {
                return undefined;
            }
        };

        // 配当金受領方式チェック: 配当金受領方式申込登録銀行No.の相関チェック4（一括）
        var checkAmeigFurikomi4 = function() {
            // 前提
            if ($scope.haitkinSunk.HAITKN_SYKN_UKTR_MSKM == '3' || $scope.haitkinSunk.AMEIG_FURIKOMI_CHK != '1') {
                return undefined;
            }
            // 入力された登録銀行No.のゆうちょ銀行の場合エラー。
            if (!checkExistError('radioHaitkinSunk') && !AppBizCom.InputCheck.isEmpty($scope.haitkinSunk.AMEIG_FURIKOMI) && checkIsYuCyoAc($scope.haitkinSunk.AMEIG_FURIKOMI)) {
                return {errId: 'KKAP-SFJ06-18E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-18E', [])};
            } else {
                return undefined;
            }
        };

        // 配当金受領方式チェック: 配当金受領方式申込登録銀行No.の相関チェック5（一括）
        var checkAmeigFurikomi5 = function() {
            // 前提
            if ($scope.haitkinSunk.HAITKN_SYKN_UKTR_MSKM == '3' || $scope.haitkinSunk.AMEIG_FURIKOMI_CHK != '1') {
                return undefined;
            }
            // 入力された登録銀行No.が存在しない（新規登録でもない）場合エラー。
            if (!checkExistError('radioHaitkinSunk') && !AppBizCom.InputCheck.isEmpty($scope.haitkinSunk.AMEIG_FURIKOMI) && checkIsNoAc($scope.haitkinSunk.AMEIG_FURIKOMI)) {
                return {errId: 'KKAP-SFJ06-19E', errMsg: AppBizCom.Msg.getMsg('KKAP-SFJ06-19E', [])};
            } else {
                return undefined;
            }
        };

        // 配当金受領方式チェック: 株式数比例配分方式申込選択と申込区分選択（配当金）の相関チェック（一括）
        var checkIsKabusu = function(checkResult) {
            // 株式数比例配分方式申込選択を選択時、 申込区分選択（配当金）の申込・変更・抹消の何れかが選択されている場合エラー。
            var nisaKozaHireihaibunNotEmpty = !AppBizCom.InputCheck.isEmpty($scope.nisa.HIREIHAIBUN);
            var haitknSyknUktrMskmNotEmpty = !AppBizCom.InputCheck.isEmpty($scope.haitkinSunk.HAITKN_SYKN_UKTR_MSKM);
            if (nisaKozaHireihaibunNotEmpty && haitknSyknUktrMskmNotEmpty) {
                var msgId = 'KKAP-SFJ06-23E';
                var param = [];
                var target1 = 'HIREIHAIBUN';
                var target2 = 'HAITKN_SYKN_UKTR_MSKM';
                var value1 = $scope.nisa.HIREIHAIBUN;
                var value2 = $scope.haitkinSunk.HAITKN_SYKN_UKTR_MSKM;
                showErrorItemsGroup(
                    'chkboxHireihaibun',
                    AppBizCom.Msg.getMsg(msgId, param),
                    msgId,
                    true
                );
                showErrorItemsGroup(
                    'radioHaitkinSunk',
                    AppBizCom.Msg.getMsg(msgId, param),
                    msgId,
                    true
                );
                if (checkResult) {
                    checkResult1Update(target1, value1, msgId, checkResult);
                    checkResult1Update(target2, value2, msgId, checkResult);
                }
                return true;
            }
            return false;
        };

        // ------------------------------------ ここから個別入力チェック END ------------------------------------ //

        // 次へ、確認画面へボタンタップ時のチェック処理
        var doAllcheck = function(){
            var checkResult : Array<any> = [false, {}, []]; // 全体チェックエラーフラグ
            var enable : String = '1'; // 変更エリアが表示している
            var unenable : String = '0'; // 変更エリアが表示していない

            // --------------------------------------- 各事務変更エリア間の相関チェック（変更前） START --------------------------------------- //

            // ご住所チェック: ①住所不明顧客で、ご住所情報が入力されていない（変更するボタンが押下されていない）場合エラー。
            // ご住所チェック: ②送付先住所登録あり、かつ送付先住所漢字がない、かつ住所の変更がされない場合エラー。
            if ($scope.modifyFlg.KYAK_ADDR_F == unenable){
                var errFlg = checkIsUnknownAddr(checkResult);
                errFlg && checkResult[2].push(sortKeys.addr_sk);
                errFlg && (checkResult[0] = true);
            }

            // 利金・分配金支払方法（包括）チェック: 利金分配金が変更指定なしで、振込先指定（売却代金）の削除対象が、利金分配金（包括）で登録されている場合エラー。
            if ($scope.modifyFlg.SUKN_HKT_F == unenable){
                var errFlg = checkIsDelSuknHoukatsu(checkResult);
                errFlg && checkResult[2].push(sortKeys.suknHoukatsu_sk);
                errFlg && (checkResult[0] = true);
            }

            // 外国証券の円貨利金分配金振込銀行チェック: 外証の円貨利金分配金振込銀行が変更指定なしで、振込先指定（売却代金）の削除対象が、外証の円貨利金分配金振込銀行で登録されている場合エラー。
            if ($scope.modifyFlg.GAIK_SYKN_YEN_F == unenable){
                var errFlg = checkGaikSyknYenF(checkResult);
                errFlg && checkResult[2].push(sortKeys.gaikSukn_sk);
                errFlg && (checkResult[0] = true);
            }

            // 外国証券の円貨利金分配金振込銀行チェック：外国証券支払方法を選択時、お受取口座で削除選択(ゆうちょも含む)されていない場合エラー。
            if ($scope.modifyFlg.GAIK_SYKN_YEN_F == enable){
                var errFlg = checkGaikSyknYenSuknAzkr(checkResult);
                errFlg && checkResult[2].push(sortKeys.gaikSukn_sk);
                errFlg && (checkResult[0] = true);
            }

            // 配当金受領方式チェック: 既に登録配当金受領口座形式で(変更なし)、登録銀行Noの削除が行われ､登録銀行Noの入力がない場合エラー。
            if ($scope.modifyFlg.HAITKN_SYKN_UKTR_F == unenable){
                var errFlg = checkIsDelHaitknSykn(checkResult);
                errFlg && checkResult[2].push(sortKeys.haitkinSunk_sk);
                errFlg && (checkResult[0] = true);
            }

            // --------------------------------------- 各事務変更エリア間の相関チェック（変更前） END --------------------------------------- //

            // --------------------------------------- 各事務変更エリア内のチェック START --------------------------------------- //
            // おなまえチェック
            if ($scope.modifyFlg.KYAKNM_F == enable){
                var nameErrFlg = false; // おなまえ変更エリアのエラーフラグ
                // おなまえの単項目チェック
                nameErrFlg = checkItems('name', checkResult);
                // おなまえ変更エリアチェック終了（エラーモーダル画面項目追加、全体チェックエラーフラグ更新）
                nameErrFlg && checkResult[2].push(sortKeys.name_sk);
                nameErrFlg && (checkResult[0] = true);
            }

            // ご住所チェック
            if ($scope.modifyFlg.KYAK_ADDR_F == enable){
                var addrErrFlg = false; // ご住所変更エリアのエラーフラグ
                // ご住所①～ご住所②の単項目チェック
                addrErrFlg = checkItems('addr', checkResult) || addrErrFlg;
                // ご住所③～ご住所③追加2グループの単項目チェック
                addrErrFlg = checkSpecItems(inputData.addr3, $scope.addr.KYAK_HOUSENM_KNJS, 'KYAK_HOUSENM_KNJS', checkResult) || addrErrFlg;
                // ご住所③カナ～ご住所③カナ追加2グループの単項目チェック
                addrErrFlg = checkSpecItems(inputData.addr3kana, $scope.addr.KYAK_HOUSENM_KANAS, 'KYAK_HOUSENM_KANAS', checkResult) || addrErrFlg;
                // 住所検索の場合、「郵便番号検索結果住所」の単項目チェック（必須チェック）
                addrErrFlg = checklblAddr1IsEmpty(checkResult) || addrErrFlg;
                // ご住所③～ご住所③追加2の最大52文字の相関チェック
                addrErrFlg = checkAddr3MaxLength(checkResult) || addrErrFlg;
                // ご住所③カナ～ご住所③カナ追加2の最大48文字（半角文字に変換後）の相関チェック
                addrErrFlg = checkAddrKana3MaxLength(checkResult) || addrErrFlg;
                // 転居日（元号）、転居日入力(年)、転居日入力(月)、転居日入力(日)の相関チェック
                addrErrFlg = checkTnykDate(checkResult) || addrErrFlg;
                // ご住所①～ご住所③追加2の最大108文字の相関チェック
                addrErrFlg = checkAddrsMaxLength(checkResult) || addrErrFlg;
                // ご住所①カナ～ご住所③カナ追加2の最大100文字（半角文字に変換後）の相関チェック
                addrErrFlg = checkAddrKanasMaxLength(checkResult) || addrErrFlg;
                // ご住所③～ご住所③追加2とご住所③カナ～ご住所③カナ追加2の相関チェック
                addrErrFlg = checkAddr3AndKana3(checkResult) || addrErrFlg;
                // ご住所変更エリアチェック終了（確認していない類似文字リンクがあれば、赤色背景を再表示（相関チェック時赤色背景がクリアされることがあるので））
                showSimlarErrGroup('txtAddr2_1-txtAddr3_1-txtAddr3_2-txtAddr3_3-txtAddrKana2_1-txtAddrKana3_1-txtAddrKana3_2-txtAddrKana3_3');
                // ご住所変更エリアチェック終了（エラーモーダル画面項目追加、全体チェックエラーフラグ更新）
                addrErrFlg && checkResult[2].push(sortKeys.addr_sk);
                addrErrFlg && (checkResult[0] = true);
            }

            // 電話番号チェック
            if ($scope.modifyFlg.TELNO_F == enable){
                var telsErrFlg = false; // 電話番号変更エリアのエラーフラグ

                // ★ 電話番号グループ(ご自宅電話番号､携帯電話番号､FAX番号)の入力可能となるケースは、以下の何れかが変更手続き入力されている場合に限る場合
                // ① おなまえ $scope.modifyFlg.KYAKNM_F
                // ② ご住所 $scope.modifyFlg.KYAK_ADDR_F
                // ③ 日興MRF累積投資口座(証券総合口座取引) $scope.modifyFlg.NIKKO_MRF_F
                // ④ 日興カード $scope.modifyFlg.NIKKO_CARD_F
                // ⑤ 日興イージートレード $scope.modifyFlg.NIKKO_EZ_F
                // ⑥ 外国証券取引口座 $scope.modifyFlg.GAIK_SYKN_KOZA_F
                // ⑦ 特定口座 $scope.modifyFlg.TKTEI_KOZA_F
                // ⑧ 特定管理口座 $scope.modifyFlg.TKTEI_KANRI_KOZA_F
                // ⑨ 加入者情報拡張登録 $scope.modifyFlg.KANYUSY_EXP_F
                // ⑩ NISA口座開設 $scope.modifyFlg.NISA_KOZA_F
                // ⑪ 個人番号告知 $scope.modifyFlg.MYNO_KOKUCHI_F
                // ⑫ 当社から送金する際のお受取口座 削除あり:tmpKozaDel、または追加あり:tmpKozaAdd
                // ⑬ 利金・分配金支払方法（包括） $scope.modifyFlg.SUKN_HKT_F
                // ⑭ 累投（株投型）分配金買付停止 $scope.modifyFlg.RUITOU_SUKN_KAIT_TEIS_F
                // ⑮ 配当金受領方式 $scope.modifyFlg.HAITKN_SYKN_UKTR_F
                var tmpKozaDel = unenable;
                for (var i = 0; i < $scope.kozaModifyFlg.length; i++) {
                    if ($scope.kozaModifyFlg[i] == '1') {
                        tmpKozaDel = enable;
                    }
                }
                var tmpKozaAdd = ($scope.kozaAdd.KOZA.length > 0) ? enable : unenable;
                if ($scope.modifyFlg.KYAKNM_F == unenable 
                    && $scope.modifyFlg.KYAK_ADDR_F == unenable 
                    && $scope.modifyFlg.NIKKO_MRF_F == unenable 
                    && $scope.modifyFlg.NIKKO_CARD_F == unenable 
                    && $scope.modifyFlg.NIKKO_EZ_F == unenable 
                    && $scope.modifyFlg.GAIK_SYKN_KOZA_F == unenable 
                    && $scope.modifyFlg.TKTEI_KOZA_F == unenable 
                    && $scope.modifyFlg.TKTEI_KANRI_KOZA_F == unenable 
                    && $scope.modifyFlg.KANYUSY_EXP_F == unenable 
                    && $scope.modifyFlg.NISA_KOZA_F == unenable 
                    && $scope.modifyFlg.MYNO_KOKUCHI_F == unenable 
                    && tmpKozaDel == unenable && tmpKozaAdd == unenable 
                    && $scope.modifyFlg.SUKN_HKT_F == unenable 
                    && $scope.modifyFlg.RUITOU_SUKN_KAIT_TEIS_F == unenable 
                    && $scope.modifyFlg.HAITKN_SYKN_UKTR_F == unenable) {
                        telsErrFlg = checkIsModified(checkResult);
                } else {
                    // 登録抹消フラグ
                    var telDelFlg = ($scope.tels.TELNO_DEL == 1) ? true : false;
                    var mobileDelFlg = ($scope.tels.MOBILE_TELNO_DEL == 1) ? true : false;
                    var faxDelFlg = ($scope.tels.FAXNO_DEL == 1) ? true : false;
                    // ご自宅電話番号１～３、携帯電話番号１～３、FAX番号１～３の単項目チェック
                    telsErrFlg = checkItems('tels', checkResult) || telsErrFlg;
                    // ご自宅電話番号１～３、携帯電話番号１～３、FAX番号１～３、全項目の相関チェック
                    if (!telDelFlg && !mobileDelFlg && !faxDelFlg) {
                        telsErrFlg = checkTels(checkResult) || telsErrFlg;
                    }
                    // ご自宅電話番号１～３、携帯電話番号１～３、全項目の相関チェック
                    if (!telDelFlg && !mobileDelFlg) {
                        telsErrFlg = checkTelMobiles(checkResult) || telsErrFlg;
                    }
                    // ご自宅電話番号１～３の最大桁数の相関チェック と ご自宅電話番号１～３の変更前と同内容の相関チェック
                    // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
                    if (!telDelFlg && !checkExistError('txtTelno1') && !checkExistError('txtTelno3')) {
                    // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913
                        var ids = 'txtTelno1-txtTelno2-txtTelno3';
                        var target = 'TELNO';
                        var param = ['ご自宅電話番号', '10'];
                        telsErrFlg = checkTelGroupMxlnAndSameOfOld(ids, target, param, 10, checkResult) || telsErrFlg;
                    }
                    // 携帯電話番号１～３の変更前と同内容の相関チェック
                    if (!mobileDelFlg) {
                        var ids = 'txtMobileTelno1-txtMobileTelno2-txtMobileTelno3';
                        var target = 'MOBILE_TELNO';
                        var param = ['携帯電話番号'];
                        telsErrFlg = checkTelGroupMxlnAndSameOfOld(ids, target, param, undefined, checkResult, true) || telsErrFlg;
                    }
                    // FAX番号１～３の最大桁数の相関チェック と FAX番号１～３の変更前と同内容の相関チェック
                    // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
                    if (!faxDelFlg && !checkExistError('txtFaxno1') && !checkExistError('txtFaxno3')) {
                    // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913
                        var ids = 'txtFaxno1-txtFaxno2-txtFaxno3';
                        var target = 'FAXNO';
                        var param = ['FAX番号', '10'];
                        telsErrFlg = checkTelGroupMxlnAndSameOfOld(ids, target, param, 10, checkResult) || telsErrFlg;
                    }
                    // 電話番号チェック: 登録抹消（ご自宅電話番号）と登録抹消（携帯電話番号）の相関チェック（一括）
                    telsErrFlg = checkDelTelMobile(checkResult) || telsErrFlg;
                }
                
                // 電話番号変更エリアチェック終了（エラーモーダル画面項目追加、全体チェックエラーフラグ更新）
                telsErrFlg && checkResult[2].push(sortKeys.tels_sk);
                telsErrFlg && (checkResult[0] = true);
            }
            // 日興MRF累積投資口座（証券総合口座取引）チェック
            if ($scope.modifyFlg.NIKKO_MRF_F == enable){
                var mrfErrFlg = false;
                // 日興MRF累積投資口座（証券総合口座取引）の単項目チェック
                mrfErrFlg = checkItems('mrf', checkResult) || mrfErrFlg;
                // 日興MRF累積投資口座（証券総合口座取引）変更エリアチェック終了
                mrfErrFlg && checkResult[2].push(sortKeys.mrf_sk);
                mrfErrFlg && (checkResult[0] = true);
            }
            // 日興カードチェック
            if ($scope.modifyFlg.NIKKO_CARD_F == enable){
                var nkCardErrFlg = false;
                // 日興カードの単項目チェック
                nkCardErrFlg = checkItems('nkCard', checkResult) || nkCardErrFlg;
                // 日興カード変更エリアチェック終了
                nkCardErrFlg && checkResult[2].push(sortKeys.nkCard_sk);
                nkCardErrFlg && (checkResult[0] = true);
            }
            // 日興イージートレードチェック
            if ($scope.modifyFlg.NIKKO_EZ_F == enable){
                var ezTradeErrFlg = false;
                // 日興イージートレードの単項目チェック
                ezTradeErrFlg = checkItems('ezTrade', checkResult) || ezTradeErrFlg;
                // 日興イージートレード変更エリアチェック終了
                ezTradeErrFlg && checkResult[2].push(sortKeys.ezTrade_sk);
                ezTradeErrFlg && (checkResult[0] = true);
            }
            // 外国証券取引口座チェック
            if ($scope.modifyFlg.GAIK_SYKN_KOZA_F == enable){
                var gaikSyknKozaErrFlg = false;
                // 外国証券取引口座の単項目チェック
                gaikSyknKozaErrFlg = checkItems('gaikSyknKoza', checkResult) || gaikSyknKozaErrFlg;
                // 外国証券取引口座変更エリアチェック終了
                gaikSyknKozaErrFlg && checkResult[2].push(sortKeys.gaikSyknKoza_sk);
                gaikSyknKozaErrFlg && (checkResult[0] = true);
            }
            // 特定口座チェック
            if ($scope.modifyFlg.TKTEI_KOZA_F == enable){
                var tkKozaErrFlg = false;
                // 特定口座の単項目チェック
                tkKozaErrFlg = checkItems('tkKoza', checkResult) || tkKozaErrFlg;
                // 年初住所（ご住所）と年初住所（特定口座）の相関チェック
                tkKozaErrFlg = checkNensyIsSame(checkResult) || tkKozaErrFlg;
                // 特定口座: 特定口座勘定区分、特定口座源泉徴収選択・配当等受入、源泉徴収変更予約の相関チェック
                tkKozaErrFlg = checkTkteiKozaOther(checkResult) || tkKozaErrFlg;
                // 特定口座変更エリアチェック終了
                tkKozaErrFlg && checkResult[2].push(sortKeys.tkKoza_sk);
                tkKozaErrFlg && (checkResult[0] = true);
            }
            // 特定管理口座チェック
            if ($scope.modifyFlg.TKTEI_KANRI_KOZA_F == enable){
                var tkKanriKozaErrFlg = false;
                // 特定管理口座の単項目チェック
                tkKanriKozaErrFlg = checkItems('tkKanriKoza', checkResult) || tkKanriKozaErrFlg;
                // 特定管理口座変更エリアチェック終了
                tkKanriKozaErrFlg && checkResult[2].push(sortKeys.tkKanriKoza_sk);
                tkKanriKozaErrFlg && (checkResult[0] = true);
            }
            // 加入者情報拡張登録チェック
            if ($scope.modifyFlg.KANYUSY_EXP_F == enable){
                var kaNyuErrFlg = false;
                // 加入者情報拡張登録の単項目チェック
                kaNyuErrFlg = checkItems('kaNyu', checkResult) || kaNyuErrFlg;
                // 加入者情報拡張登録変更エリアチェック終了
                kaNyuErrFlg && checkResult[2].push(sortKeys.kaNyu_sk);
                kaNyuErrFlg && (checkResult[0] = true);
            }
            // NISA口座開設チェック
            if ($scope.modifyFlg.NISA_KOZA_F == enable){
                var nisaErrFlg = false;
                // NISA口座開設の単項目チェック
                nisaErrFlg = checkItems('nisa', checkResult) || nisaErrFlg;
                // NISA口座開設変更エリアチェック終了
                nisaErrFlg && checkResult[2].push(sortKeys.nisa_sk);
                nisaErrFlg && (checkResult[0] = true);
            }
            // 個人番号告知チェック
            if ($scope.modifyFlg.MYNO_KOKUCHI_F == enable){
                var myNumberErrFlg = false;
                // 個人番号告知の単項目チェック
                myNumberErrFlg = checkItems('myNumber', checkResult) || myNumberErrFlg;
                // 個人番号告知変更エリアチェック終了
                myNumberErrFlg && checkResult[2].push(sortKeys.myNumber_sk);
                myNumberErrFlg && (checkResult[0] = true);
            }
            /* 当社から送金する際のお受取口座チェック------------START */
            // 当社から送金する際のお受取口座チェック（削除分）
            var kozaDelErrFlg = checkKozaDelIsEmpty(checkResult);
            // 当社から送金する際のお受取口座チェック（追加分）相関チェック１
            var kozaOther1ErrFlg = checkKozaOther1(checkResult);
            // 当社から送金する際のお受取口座チェック（追加分）
            var kozaAddErrFlg = kozaOther1ErrFlg ? [] : checkKozaAdds(checkResult);
            // 当社から送金する際のお受取口座チェック（追加分）相関チェック２
            var kozaOther2ErrFlg = kozaOther1ErrFlg || checkKozaOther2(checkResult, kozaAddErrFlg);
            // 当社から送金する際のお受取口座変更エリアチェック終了
            (kozaDelErrFlg || kozaOther1ErrFlg || kozaAddErrFlg.indexOf(true) > -1 || kozaOther2ErrFlg) && checkResult[2].push(sortKeys.kozaAdd_sk);
            (kozaDelErrFlg || kozaOther1ErrFlg || kozaAddErrFlg.indexOf(true) > -1 || kozaOther2ErrFlg) && (checkResult[0] = true);
            /* 当社から送金する際のお受取口座チェック------------END */
            // 利金・分配金支払方法（包括）チェック
            if ($scope.modifyFlg.SUKN_HKT_F == enable){
                var suknHoukatsuErrFlg = false;
                // 前0埋め処理 登録銀行No.に入力値があれば、前0埋め処理を実行する
                if (!AppBizCom.InputCheck.isEmpty($scope.suknHoukatsu.SUKN_HKT_TRKNO)) {
                    $scope.suknHoukatsu.SUKN_HKT_TRKNO = ("0" + $scope.suknHoukatsu.SUKN_HKT_TRKNO).slice(-2);
                }

                // 利金・分配金支払方法（包括）の単項目チェック
                suknHoukatsuErrFlg = checkItems('suknHoukatsu', checkResult) || suknHoukatsuErrFlg;
                // 利金・分配金支払方法（包括）変更エリアチェック終了
                suknHoukatsuErrFlg && checkResult[2].push(sortKeys.suknHoukatsu_sk);
                suknHoukatsuErrFlg && (checkResult[0] = true);
            }
            // 利金・分配金支払方法（銘柄）チェック
            if ($scope.modifyFlg.SUKN_HKT_MEIG_F == enable){
                var suknMeigaraErrFlg = false;
                // 利金・分配金支払方法（銘柄）の単項目チェック
                suknMeigaraErrFlg = checkItems('suknMeigara', checkResult) || suknMeigaraErrFlg;
                // 利金・分配金支払方法（銘柄）変更エリアチェック終了
                suknMeigaraErrFlg && checkResult[2].push(sortKeys.suknMeigara_sk);
                suknMeigaraErrFlg && (checkResult[0] = true);
            }
            // 外国証券の円貨利金分配金振込銀行チェック
            if ($scope.modifyFlg.GAIK_SYKN_YEN_F == enable){
                var gaikSuknErrFlg = false;
                // 前0埋め処理 登録銀行No.に入力値があれば、前0埋め処理を実行する
                if (!AppBizCom.InputCheck.isEmpty($scope.gaikSukn.GAIK_SYKN_YEN_SUKN_BK)) {
                    $scope.gaikSukn.GAIK_SYKN_YEN_SUKN_BK = ("0" + $scope.gaikSukn.GAIK_SYKN_YEN_SUKN_BK).slice(-2);
                }

                // 外国証券の円貨利金分配金振込銀行の単項目チェック
                gaikSuknErrFlg = checkItems('gaikSukn', checkResult) || gaikSuknErrFlg;
                // 外国証券の円貨利金分配金振込銀行変更エリアチェック終了
                gaikSuknErrFlg && checkResult[2].push(sortKeys.gaikSukn_sk);
                gaikSuknErrFlg && (checkResult[0] = true);
            }
            // 累投（株投型）分配金買付停止チェック
            if ($scope.modifyFlg.RUITOU_SUKN_KAIT_TEIS_F == enable){
                var ruiTouSunkErrFlg = false;
                // 前0埋め処理 登録銀行No.に入力値があれば、前0埋め処理を実行する
                if (!AppBizCom.InputCheck.isEmpty($scope.ruiTouSunk.RUITOU_SUKN_TRKNO)) {
                    $scope.ruiTouSunk.RUITOU_SUKN_TRKNO = ("0" + $scope.ruiTouSunk.RUITOU_SUKN_TRKNO).slice(-2);
                }

                // 累投（株投型）分配金買付停止の単項目チェック
                ruiTouSunkErrFlg = checkItems('ruiTouSunk', checkResult) || ruiTouSunkErrFlg;
                // 累投（株投型）分配金買付停止変更エリアチェック終了
                ruiTouSunkErrFlg && checkResult[2].push(sortKeys.ruiTouSunk_sk);
                ruiTouSunkErrFlg && (checkResult[0] = true);
            }
            // 配当金受領方式チェック
            if ($scope.modifyFlg.HAITKN_SYKN_UKTR_F == enable){
                var haitkinSunkErrFlg = false;
                // 前0埋め処理 登録銀行No.に入力値があれば、前0埋め処理を実行する
                if (!AppBizCom.InputCheck.isEmpty($scope.haitkinSunk.AMEIG_FURIKOMI)) {
                    $scope.haitkinSunk.AMEIG_FURIKOMI = ("0" + $scope.haitkinSunk.AMEIG_FURIKOMI).slice(-2);
                }

                // 配当金受領方式の単項目チェック
                haitkinSunkErrFlg = checkItems('haitkinSunk', checkResult) || haitkinSunkErrFlg;
                // 配当金受領方式変更エリアチェック終了
                haitkinSunkErrFlg && checkResult[2].push(sortKeys.haitkinSunk_sk);
                haitkinSunkErrFlg && (checkResult[0] = true);
            }

            // --------------------------------------- 各事務変更エリア内のチェック END --------------------------------------- //

            // --------------------------------------- 各事務変更エリア間の相関チェック（変更後） START --------------------------------------- //

            // NISA口座開設チェック: 株式数比例配分方式申込選択を選択時、 申込区分選択（配当金）の申込・変更・抹消の何れかが選択されている場合エラー。
            // 配当金受領方式チェック: 株式数比例配分方式申込選択を選択時、 申込区分選択（配当金）の申込・変更・抹消の何れかが選択されている場合エラー。
            if ($scope.modifyFlg.NISA_KOZA_F == enable && $scope.modifyFlg.HAITKN_SYKN_UKTR_F == enable){
                var errFlg = checkIsKabusu(checkResult);
                errFlg && checkResult[2].push(sortKeys.nisa_sk);
                errFlg && checkResult[2].push(sortKeys.haitkinSunk_sk);
                errFlg && (checkResult[0] = true);
            }

            // 累投（株投型）分配金買付停止チェック: 「当社から送金する際のお受取口座」の”削除入力”が行われた場合、「累投(株投型)分配金買付停止」の入力を必須とする（一括）
            if ($scope.modifyFlg.RUITOU_SUKN_KAIT_TEIS_F == unenable){
                var errFlg = checkRuitouSuknKaitTeiBefore(checkResult) || ruiTouSunkErrFlg;
                errFlg && checkResult[2].push(sortKeys.ruiTouSunk_sk);
                errFlg && (checkResult[0] = true);
            }

            // --------------------------------------- 各事務変更エリア間の相関チェック（変更後） END --------------------------------------- //

            // 全体のチェック結果を返却する
            return checkResult;
        }

        /**---------------------------------------------------------------
         * 指定対象のグループチェック
         *
         * @param {string} target - 指定対象
         * @param {any} checkResult - 全体のチェック結果
         * @return {boolean} - 指定対象の所属する変更エリアのエラーフラグ
         */
        var checkItems = function (target, checkResult) {
            return checkSpecItems(inputData[target], $scope[target], '', checkResult);
        };

        /**---------------------------------------------------------------
         * 指定対象のグループチェック
         *
         * @param {any} defines - 指定対象のグループの画面入力項目定義
         * @param {any} values - 指定対象のグループの画面入力値
         * @param {any} item - 指定対象
         * @param {any} checkResult - 全体のチェック結果
         * @param {any} arrayIndex - 配列対象のインデックス（省略可、ディフォルト値はundefined）
         * @return {boolean} - 指定対象の所属する変更エリアのエラーフラグ
         */
        var checkSpecItems = function (defines, values, item, checkResult, arrayIndex = undefined) {
            var msgParam: any = checkResult[1];
            var tempResult: Array<any> = AppLgcMultiCheck.multiInputCheck(defines, values);
            var blockErrFlg = tempResult[0];
            if (item) {
                if (undefined != arrayIndex) {
                    msgParam[item] = msgParam[item] || {};
                    msgParam[item][arrayIndex] = tempResult[1];
                } else {
                    msgParam[item] = tempResult[1];
                }
            } else {
                msgParam = Object.assign(msgParam, tempResult[1]);
            }
            checkResult[1] = msgParam;
            return blockErrFlg;
        };

        /**---------------------------------------------------------------
         * エラー項目リストを正規化する（重複のエラー項目を削除）
         *
         * @param {Array} arr - エラー項目リスト
         * @return {Array} - 正規化後のエラー項目リスト
         */
        var getUniqueList = function (arr) {
            var tmpArr = [];
            var newArr = [];
            for (var i = 0; i < arr.length; i++) {
                if (tmpArr.indexOf(arr[i].sort) < 0) {
                    tmpArr.push(arr[i].sort);
                    newArr.push(arr[i]);
                }
            }
            return newArr;
        };

        // 画面入力項目定義
        var inputData = {
            // おなまえ
            name: {
                KYAKNM_SEI_KNJ: {
                    applyName: 'KYAKNM_SEI_KNJ', // 項目の共通領域名
                    id: 'txtKyaknmSeiKnj', // 画面項目id
                    name: 'おなまえ（漢字）姓', // 画面項目名
                    requireString: 'full', // 文字変換タイプ
                    handWrite: 'text_all', // 手書き文字認識タイプ
                    similarType: chkSimilarConst.SIMILAR_CHECK_TYPE.FULL_ALL, // 類似文字チェックタイプ
                    typeSelect: false, // 入力項目タイプ
                    length: 20, // 最大文字数
                    needRequireCheck: true,
                    valChangChk: [[clearNameSeiKanjiError, 'isFullString', 'hasForbidChar', 'chkMaxLength'], [checkNameKanjiSeiMaxLegth], ['hasSimilar']], // 随時入力チェック仕様（値変更時）
                    allChk: [['isEmpty'], ['isFullString', 'hasForbidChar', 'chkMaxLength']], // 一括チェック仕様
                },
                KYAKNM_MEI_KNJ: {
                    applyName: 'KYAKNM_SEI_KNJ', // 項目の共通領域名
                    id: 'txtKyaknmMeiKnj', // 画面項目id
                    name: 'おなまえ（漢字）名', // 画面項目名
                    requireString: 'full', // 文字変換タイプ
                    handWrite: 'text_all', // 手書き文字認識タイプ
                    similarType: chkSimilarConst.SIMILAR_CHECK_TYPE.FULL_ALL, // 類似文字チェックタイプ
                    typeSelect: false, // 入力項目タイプ
                    length: 20, // 最大文字数
                    needRequireCheck: true,
                    valChangChk: [[clearNameMeiKanjiError, 'isFullString', 'hasForbidChar', 'chkMaxLength'], [checkNameKanjiMeiMaxLegth], ['hasSimilar']], // 随時入力チェック仕様（値変更時）
                    allChk: [['isEmpty'], ['isFullString', 'hasForbidChar', 'chkMaxLength'], [checkNameKanjiMaxLength]], // 一括チェック仕様
                },
                KYAKNM_SEI_KANA: {
                    applyName: 'KYAKNM_SEI_KANA', // 項目の共通領域名
                    id: 'txtKyaknmSeiKana', // 画面項目id
                    name: 'おなまえ（カナ）姓', // 画面項目名
                    requireString: 'full', // 文字変換タイプ
                    handWrite: 'text_kana', // 手書き文字認識タイプ
                    similarType: chkSimilarConst.SIMILAR_CHECK_TYPE.KANA, // 類似文字チェックタイプ
                    typeSelect: false, // 入力項目タイプ
                    length: 30, // 最大文字数
                    requireHyphen: 'true', // 長音、ハイフンマイナスをハイフンへ変更する
                    valChangChk: [[clearNameSeiKanaError, 'isFullHurigana', 'hasForbidChar', 'chkMaxLength'], [checkNameKanaMaxLength], ['hasSimilar']], // 随時入力チェック仕様（値変更時）
                    allChk: [['isEmpty'], ['isFullHurigana', 'hasForbidChar', 'chkMaxLength']], // 一括チェック仕様
                },
                KYAKNM_MEI_KANA: {
                    applyName: 'KYAKNM_MEI_KANA', // 項目の共通領域名
                    id: 'txtKyaknmMeiKana', // 画面項目id
                    name: 'おなまえ（カナ）名', // 画面項目名
                    requireString: 'full', // 文字変換タイプ
                    handWrite: 'text_kana', // 手書き文字認識タイプ
                    similarType: chkSimilarConst.SIMILAR_CHECK_TYPE.KANA, // 類似文字チェックタイプ
                    typeSelect: false, // 入力項目タイプ
                    length: 30, // 最大文字数
                    requireHyphen: 'true', // 長音、ハイフンマイナスをハイフンへ変更する
                    valChangChk: [[clearNameMeiKanaError, 'isFullHurigana', 'hasForbidChar', 'chkMaxLength'], [checkNameKanaMaxLength], ['hasSimilar']], // 随時入力チェック仕様（値変更時）
                    allChk: [['isEmpty'], ['isFullHurigana', 'hasForbidChar', 'chkMaxLength'], [checkNameKanaMaxLength]], // 一括チェック仕様
                },
            },
            // ご住所
            addr: {
                YUBINNO_1: {
                    applyName: 'YUBINNO_1', // 項目の共通領域名
                    id: 'txtAddrNum1', // 画面項目id
                    name: '郵便番号（３桁）', // 画面項目名
                    typeSelect: false, // 入力項目タイプ
                    length: 3, // 最大文字数
                    numPad: true, // 数字キーボード
                    onBlurChk: [['isNum', 'chkSameLength'], [checkYubinNo1AllZero]], // 随時入力チェック仕様（フォーカス外し時）
                    allChk: [['isEmpty'], ['isNum', 'chkSameLength'], [checkYubinNo1AllZero]], // 一括チェック仕様
                },
                YUBINNO_2: {
                    applyName: 'YUBINNO_2', // 項目の共通領域名
                    id: 'txtAddrNum2', // 画面項目id
                    name: '郵便番号（４桁）', // 画面項目名
                    typeSelect: false, // 入力項目タイプ
                    length: 4, // 最大文字数
                    numPad: true, // 数字キーボード
                    onBlurChk: [['isNum', 'chkSameLength']], // 随時入力チェック仕様（フォーカス外し時）
                    allChk: [['isEmpty'], ['isNum', 'chkSameLength']], // 一括チェック仕様
                },
                KYAK_ADDR_TDHKN: {
                    applyName: 'KYAK_ADDR_TDHKN', // 項目の共通領域名
                    id: 'pldAddrTDFK', // 画面項目id
                    name: 'ご住所①（都道府県）', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [['isEmpty']], // 一括チェック仕様
                },
                KYAK_HOSK_ADDR_KNJ: {
                    applyName: 'KYAK_HOSK_ADDR_KNJ', // 項目の共通領域名
                    id: 'txtAddr2_1', // 画面項目id
                    name: 'ご住所②', // 画面項目名
                    requireString: 'full', // 文字変換タイプ
                    handWrite: 'text_all', // 手書き文字認識タイプ
                    similarType: chkSimilarConst.SIMILAR_CHECK_TYPE.FULL_ALL, // 類似文字チェックタイプ
                    typeSelect: false, // 入力項目タイプ
                    needRequireCheck: true,
                    valChangChk: [[clearAddr2_1Error, 'isFullString', 'hasForbidChar', checkAddr2MaxLength], [checkAddrsMaxLength], ['hasSimilar']], // 随時入力チェック仕様（値変更時）
                    allChk: [['isEmpty'], ['isFullString', 'hasForbidChar', checkAddr2MaxLength]], // 一括チェック仕様
                },
                KYAK_HOSK_ADDR_KANA: {
                    applyName: 'KYAK_HOSK_ADDR_KANA', // 項目の共通領域名
                    id: 'txtAddrKana2_1', // 画面項目id
                    name: 'ご住所②のフリガナ', // 画面項目名
                    requireString: 'full', // 文字変換タイプ
                    requireHyphen: 'true', // 長音、ハイフンマイナスをハイフンへ変更する
                    handWrite: 'text_kana', // 手書き文字認識タイプ
                    similarType: chkSimilarConst.SIMILAR_CHECK_TYPE.KANA, // 類似文字チェックタイプ
                    typeSelect: false, // 入力項目タイプ
                    length: 18, // 最大文字桁数
                    valChangChk: [[clearAddrKana2_1Error, 'isFullHurigana', 'hasForbidChar', checkAddrKana2MaxLength], [checkAddrKanasMaxLength], ['hasSimilar']], // 随時入力チェック仕様（値変更時）
                    allChk: [['isEmpty'], ['isFullHurigana', 'hasForbidChar', checkAddrKana2MaxLength]], // 一括チェック仕様
                },
                TNKY_GNGO: {
                    applyName: 'TNKY_GNGO', // 項目の共通領域名
                    id: 'pldTnkyGngo', // 画面項目id
                    name: '転居日（元号）', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [[checkTnkyGengoIsEmpty]], // 一括チェック仕様
                },
                TNKYY:{
                    applyName: 'TNKYY', // 項目の共通領域名
                    id: 'txtTnkyYear', // 画面項目id
                    name: '転居日（年）', // 画面項目名
                    typeSelect: false, // 入力項目タイプ
                    numPad: true, // 数字キーボード
                    onBlurChk: [[clearTnkyYearError, 'isNum'], [checkTnkyGengoYear], [checkTnykGengoYearMonthDay]], // 随時入力チェック仕様（フォーカス外し時）
                    allChk: [[checkTnkyYearIsEmpty], ['isNum'], [checkTnkyGengoYear]], // 一括チェック仕様         
                },
                TNKYM:{
                    applyName: 'TNKYM', // 項目の共通領域名
                    id: 'txtTnkyMonth', // 画面項目id
                    name: '転居日（月）', // 画面項目名
                    typeSelect: false, // 入力項目タイプ
                    numPad: true, // 数字キーボード
                    onBlurChk: [[clearTnkyMonthError, 'isNum'], [ checkTnykMonthFromTo], [checkTnykGengoYearMonthDay]], // 随時入力チェック仕様（フォーカス外し時）
                    allChk: [[checkTnkyMonthIsEmpty], ['isNum'], [checkTnykMonthFromTo]], // 一括チェック仕様         
                },
                TNKYD:{
                    applyName: 'TNKYD', // 項目の共通領域名
                    id: 'txtTnkyDay', // 画面項目id
                    name: '転居日（日）', // 画面項目名
                    typeSelect: false, // 入力項目タイプ
                    numPad: true, // 数字キーボード
                    onBlurChk: [[clearTnkyDayError, 'isNum'] , [checkTnykDayFromTo], [checkTnykGengoYearMonthDay]], // 随時入力チェック仕様（フォーカス外し時）
                    allChk: [[checkTnkyDayIsEmpty], ['isNum'], [checkTnykDayFromTo]], // 一括チェック仕様       
                },
                NENSY_JSY: {
                    applyName: 'NENSY_JSY', // 項目の共通領域名
                    id: 'pldNensyJsy', // 画面項目id
                    name: '年初住所', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [[checkTnkyNensyIsEmpty]], // 一括チェック仕様
                },
                MNSYSEIRY_JISN_FLAG: {
                    applyName: 'MNSYSEIRY_JISN_FLAG', // 項目の共通領域名
                    id: 'radioMnsyseiryJoho', // 画面項目id
                    name: '番号確認書類', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [['isEmpty']], // 一括チェック仕様
                },
            },
            // ご住所③～ご住所③追加2
            addr3:{
                0:{
                    applyName: 'KYAK_HOUSENM_KNJ', // 項目の共通領域名
                    id: 'txtAddr3_1', // 画面項目id
                    name: 'ご住所③', // 画面項目名
                    requireString: 'full', // 文字変換タイプ
                    handWrite: 'text_all', // 手書き文字認識タイプ
                    similarType: chkSimilarConst.SIMILAR_CHECK_TYPE.FULL_ALL, // 類似文字チェックタイプ
                    typeSelect: false, // 入力項目タイプ
                    length: 14, // 最大文字桁数
                    needRequireCheck: true,
                    valChangChk: [[clearAddr3_1Error, 'isFullString', 'hasForbidChar', 'chkMaxLength'], [checkAddr3MaxLength, checkAddrsMaxLength], ['hasSimilar']], // 随時入力チェック仕様（値変更時）
                    allChk: [['isFullString', 'hasForbidChar', 'chkMaxLength']], // 一括チェック仕様
                },
                1:{
                    applyName: 'KYAK_HOUSENM_KNJ', // 項目の共通領域名
                    id: 'txtAddr3_2', // 画面項目id
                    name: 'ご住所③', // 画面項目名
                    requireString: 'full', // 文字変換タイプ
                    handWrite: 'text_all', // 手書き文字認識タイプ
                    similarType: chkSimilarConst.SIMILAR_CHECK_TYPE.FULL_ALL, // 類似文字チェックタイプ
                    typeSelect: false, // 入力項目タイプ
                    length: 20, // 最大文字桁数
                    needRequireCheck: true,
                    valChangChk: [[clearAddr3_2Error, 'isFullString', 'hasForbidChar', 'chkMaxLength'], [checkAddr3MaxLength, checkAddrsMaxLength], ['hasSimilar']], // 随時入力チェック仕様（値変更時）
                    allChk: [['isFullString', 'hasForbidChar', 'chkMaxLength']], // 一括チェック仕様
                },
                2:{
                    applyName: 'KYAK_HOUSENM_KNJ', // 項目の共通領域名
                    id: 'txtAddr3_3', // 画面項目id
                    name: 'ご住所③', // 画面項目名
                    requireString: 'full', // 文字変換タイプ
                    handWrite: 'text_all', // 手書き文字認識タイプ
                    similarType: chkSimilarConst.SIMILAR_CHECK_TYPE.FULL_ALL, // 類似文字チェックタイプ
                    typeSelect: false, // 入力項目タイプ
                    length: 20, // 最大文字桁数
                    needRequireCheck: true,
                    valChangChk: [[clearAddr3_3Error,'isFullString', 'hasForbidChar', 'chkMaxLength'], [checkAddr3MaxLength, checkAddrsMaxLength], ['hasSimilar']], // 随時入力チェック仕様（値変更時）
                    allChk: [['isFullString', 'hasForbidChar', 'chkMaxLength']], // 一括チェック仕様
                },
            },
            // ご住所③カナ～ご住所③カナ追加2
            addr3kana:{
                0: {
                    applyName: 'KYAK_HOUSENM_KANA', // 項目の共通領域名
                    id: 'txtAddrKana3_1', // 画面項目id
                    name: 'ご住所③のフリガナ', // 画面項目名
                    requireString: 'full', // 文字変換タイプ
                    handWrite: 'text_kana', // 手書き文字認識タイプ
                    similarType: chkSimilarConst.SIMILAR_CHECK_TYPE.KANA, // 類似文字チェックタイプ
                    requireHyphen: 'true', // 長音、ハイフンマイナスをハイフンへ変更する
                    typeSelect: false, // 入力項目タイプ
                    length: 18, // 最大文字桁数
                    needRequireCheck: true,
                    valChangChk: [[clearAddrKana3_1Error, 'isFullHurigana', 'hasForbidChar', checkAddrKana3_1MaxLength], [checkAddrKana3MaxLength, checkAddrKanasMaxLength], ['hasSimilar']], // 随時入力チェック仕様（値変更時）
                    allChk: [['isFullHurigana', 'hasForbidChar', checkAddrKana3_1MaxLength]], // 一括チェック仕様
                },
                1: {
                    applyName: 'KYAK_HOUSENM_KANA', // 項目の共通領域名
                    id: 'txtAddrKana3_2', // 画面項目id
                    name: 'ご住所③のフリガナ', // 画面項目名
                    requireString: 'full', // 文字変換タイプ
                    handWrite: 'text_kana', // 手書き文字認識タイプ
                    similarType: chkSimilarConst.SIMILAR_CHECK_TYPE.KANA, // 類似文字チェックタイプ
                    requireHyphen: 'true', // 長音、ハイフンマイナスをハイフンへ変更する
                    typeSelect: false, // 入力項目タイプ
                    length: 30, // 最大文字桁数
                    needRequireCheck: true,
                    valChangChk: [[clearAddrKana3_2Error, 'isFullHurigana', 'hasForbidChar', checkAddrKana3_2MaxLength], [checkAddrKana3MaxLength, checkAddrKanasMaxLength], ['hasSimilar']], // 随時入力チェック仕様（値変更時）
                    allChk: [['isFullHurigana', 'hasForbidChar', checkAddrKana3_2MaxLength]], // 一括チェック仕様
                },
                2: {
                    applyName: 'KYAK_HOUSENM_KANA', // 項目の共通領域名
                    id: 'txtAddrKana3_3', // 画面項目id
                    name: 'ご住所③のフリガナ', // 画面項目名
                    requireString: 'full', // 文字変換タイプ
                    handWrite: 'text_kana', // 手書き文字認識タイプ
                    similarType: chkSimilarConst.SIMILAR_CHECK_TYPE.KANA, // 類似文字チェックタイプ
                    requireHyphen: 'true', // 長音、ハイフンマイナスをハイフンへ変更する
                    typeSelect: false, // 入力項目タイプ
                    length: 30, // 最大文字桁数
                    needRequireCheck: true,
                    valChangChk: [[clearAddrKana3_3Error, 'isFullHurigana', 'hasForbidChar', checkAddrKana3_3MaxLength], [checkAddrKana3MaxLength, checkAddrKanasMaxLength], ['hasSimilar']], // 随時入力チェック仕様（値変更時）
                    allChk: [['isFullHurigana', 'hasForbidChar', checkAddrKana3_3MaxLength]], // 一括チェック仕様
                },
            },
            // 電話番号
            tels:{
                TELNO1:{
                    applyName: 'TELNO1', // 項目の共通領域名
                    id: 'txtTelno1', // 画面項目id
                    name: 'ご自宅電話番号１', // 画面項目名
                    typeSelect: false, // 入力項目タイプ
                    numPad: true, // 数字キーボード
                    // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
                    onBlurChk: [[clearTelGroupError, 'isNum', checkTelno1, checkTel12Length, checkTelGroupMaxLength]], // 随時入力チェック仕様（フォーカス外し時）
                    allChk: [[checkTelno1IsInGroup], ['isNum', checkTelno1, checkTel12Length]], // 一括チェック仕様
                    // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913
                },
                TELNO2:{
                    applyName: 'TELNO2', // 項目の共通領域名
                    id: 'txtTelno2', // 画面項目id
                    name: 'ご自宅電話番号２', // 画面項目名
                    typeSelect: false, // 入力項目タイプ
                    numPad: true, // 数字キーボード
                    // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
                    onBlurChk: [[clearTelGroupError, 'isNum', checkTel12Length, checkTelGroupMaxLength]], // 随時入力チェック仕様（フォーカス外し時）
                    allChk: [[checkTelno2IsInGroup], ['isNum', checkTel12Length]], // 一括チェック仕様
                    // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913
                },
                TELNO3:{
                    applyName: 'TELNO3', // 項目の共通領域名
                    id: 'txtTelno3', // 画面項目id
                    name: 'ご自宅電話番号３', // 画面項目名
                    typeSelect: false, // 入力項目タイプ
                    numPad: true, // 数字キーボード
                    // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
                    onBlurChk: [[clearTelGroupError, 'isNum', telLengthCheck3Blur, checkTel12Length, checkTelGroupMaxLength]], // 随時入力チェック仕様（フォーカス外し時）
                    allChk: [[checkTelno3IsInGroup], ['isNum', telLengthCheck3, checkTel12Length]], // 一括チェック仕様
                    // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913
                },
                TELNO_DEL: {
                    applyName: 'TELNO_DEL', // 項目の共通領域名
                    id: 'chkboxTelDel', // 画面項目id
                    name: '登録抹消（ご自宅電話番号）', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [checkDelTelnos, checkDelTelnos2], // 一括チェック仕様
                },
                MOBILE_TELNO1:{
                    applyName: 'MOBILE_TELNO1', // 項目の共通領域名
                    id: 'txtMobileTelno1', // 画面項目id
                    name: '携帯電話番号１', // 画面項目名
                    typeSelect: false, // 入力項目タイプ
                    numPad: true, // 数字キーボード
                    onBlurChk: [[clearMobileGroupError, 'isNum', checkMobileTelno1]], // 随時入力チェック仕様（フォーカス外し時）
                    allChk: [[checkMobile1IsInGroup], ['isNum', checkMobileTelno1]], // 一括チェック仕様
                },
                MOBILE_TELNO2:{
                    applyName: 'MOBILE_TELNO2', // 項目の共通領域名
                    id: 'txtMobileTelno2', // 画面項目id
                    name: '携帯電話番号２', // 画面項目名
                    typeSelect: false, // 入力項目タイプ
                    numPad: true, // 数字キーボード
                    // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
                    onBlurChk: [[clearMobileGroupError, 'isNum', mobileLengthCheck2Blur]], // 随時入力チェック仕様（フォーカス外し時）
                    allChk: [[checkMobile2IsInGroup], ['isNum', mobileLengthCheck2]], // 一括チェック仕様
                    // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913
                },
                MOBILE_TELNO3:{
                    applyName: 'MOBILE_TELNO3', // 項目の共通領域名
                    id: 'txtMobileTelno3', // 画面項目id
                    name: '携帯電話番号３', // 画面項目名
                    typeSelect: false, // 入力項目タイプ
                    numPad: true, // 数字キーボード
                    // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
                    onBlurChk: [[clearMobileGroupError, 'isNum', mobileLengthCheck3Blur]], // 随時入力チェック仕様（フォーカス外し時）
                    allChk: [[checkMobile3IsInGroup], ['isNum', mobileLengthCheck3]], // 一括チェック仕様
                    // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913
                },
                MOBILE_TELNO_DEL: {
                    applyName: 'MOBILE_TELNO_DEL', // 項目の共通領域名
                    id: 'chkboxMobileTelDel', // 画面項目id
                    name: '登録抹消（携帯電話番号）', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [checkDelMobiles, checkDelMobiles2], // 一括チェック仕様
                },
                FAXNO1:{
                    applyName: 'FAXNO1', // 項目の共通領域名
                    id: 'txtFaxno1', // 画面項目id
                    name: 'FAX番号１', // 画面項目名
                    typeSelect: false, // 入力項目タイプ
                    numPad: true, // 数字キーボード
                    // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
                    onBlurChk: [[clearFaxGroupError, 'isNum', checkFaxno1, checkFax12Length, checkFaxGroupMaxLength]], // 随時入力チェック仕様（フォーカス外し時）
                    allChk: [[checkFaxno1IsInGroup], ['isNum', checkFaxno1, checkFax12Length]], // 一括チェック仕様
                    // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913
                },
                FAXNO2:{
                    applyName: 'FAXNO2', // 項目の共通領域名
                    id: 'txtFaxno2', // 画面項目id
                    name: 'FAX番号２', // 画面項目名
                    typeSelect: false, // 入力項目タイプ
                    numPad: true, // 数字キーボード
                    // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
                    onBlurChk: [[clearFaxGroupError, 'isNum', checkFax12Length, checkFaxGroupMaxLength]], // 随時入力チェック仕様（フォーカス外し時）
                    allChk: [[checkFaxno2IsInGroup], ['isNum', checkFax12Length]], // 一括チェック仕様
                    // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913
                },
                FAXNO3:{
                    applyName: 'FAXNO3', // 項目の共通領域名
                    id: 'txtFaxno3', // 画面項目id
                    name: 'FAX番号３', // 画面項目名
                    typeSelect: false, // 入力項目タイプ
                    numPad: true, // 数字キーボード
                    // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
                    onBlurChk: [[clearFaxGroupError, 'isNum', faxLengthCheck3Blur, checkFax12Length, checkFaxGroupMaxLength]], // 随時入力チェック仕様（フォーカス外し時）
                    allChk: [[checkFaxno3IsInGroup], ['isNum', faxLengthCheck3, checkFax12Length]], // 一括チェック仕様
                    // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913
                },
                FAXNO_DEL: {
                    applyName: 'FAXNO_DEL', // 項目の共通領域名
                    id: 'chkboxFaxnoDel', // 画面項目id
                    name: '登録抹消（FAX番号）', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [checkDelFaxs], // 一括チェック仕様
                }
            },
            // 日興MRF累積投資口座（証券総合口座取引）
            mrf: {
                NIKKO_MRF:{
                    applyName: 'NIKKO_MRF', // 項目の共通領域名
                    id: 'chkboxNikkoMRF', // 画面項目id
                    name: '日興MRF累積投資口座', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [['isEmpty']], // 一括チェック仕様
                },
            },
            // 日興カード
            nkCard: {
                NIKKO_CARD:{
                    applyName: 'NIKKO_CARD', // 項目の共通領域名
                    id: 'radioNikkoCard', // 画面項目id
                    name: '申込区分', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [['isEmpty'], [checkNkCard]], // 一括チェック仕様
                },
            },
            // 日興イージートレード
            ezTrade: {
                NIKKO_EZ:{
                    applyName: 'NIKKO_EZ', // 項目の共通領域名
                    id: 'radioNikkoEZ', // 画面項目id
                    name: '申込区分', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [['isEmpty'], [checkNkEZ]], // 一括チェック仕様
                },
            },
            // 外国証券取引口座
            gaikSyknKoza: {
                GAIK_SYKN_KOZA:{
                    applyName: 'GAIK_SYKN_KOZA', // 項目の共通領域名
                    id: 'chkboxGaikSyknKozaMRF', // 画面項目id
                    name: '外国証券取引口座', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [['isEmpty']], // 一括チェック仕様
                },
            },
            // 特定口座
            tkKoza: {
                TKTEI_KOZA_MSKM:{
                    applyName: 'TKTEI_KOZA_MSKM', // 項目の共通領域名
                    id: 'radioTkKoza', // 画面項目id
                    name: '申込区分', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [['isEmpty'], [checkTkteiKozaMskm]], // 一括チェック仕様
                },
                TKTEI_KOZA_AC:{
                    applyName: 'TKTEI_KOZA_AC', // 項目の共通領域名
                    id: 'radioTkkozaAC', // 画面項目id
                    name: '勘定区分', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [[checkTkteiKozaAcIsEmpty, checkTkteiKozaAc]], // 一括チェック仕様
                },                
                TKTEI_KOZA_GNSN:{
                    applyName: 'TKTEI_KOZA_GNSN', // 項目の共通領域名
                    id: 'radioTkkozaGNSN', // 画面項目id
                    name: '特定口座源泉徴収選択・配当等受入', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [[checkTkteiKozaGnsnIsEmpty, checkTkteiKozaGnsn1, checkTkteiKozaGnsn2]], // 一括チェック仕様
                },
                TKTEI_KOZA_NENSY_JSY:{
                    applyName: 'TKTEI_KOZA_NENSY_JSY', // 項目の共通領域名
                    id: 'pldTkteiKozaNensy', // 画面項目id
                    name: '年初住所', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [[checkTkteiKozaNensyJsyIsEmpty]], // 一括チェック仕様
                },
                TKTEI_KOZA_YYK:{
                    applyName: 'TKTEI_KOZA_YYK', // 項目の共通領域名
                    id: 'radioTkKozaYYK', // 画面項目id
                    name: '源泉徴収変更予約', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [checkTkteiKozaYyk1, checkTkteiKozaYyk2, checkTkteiKozaYyk3], // 一括チェック仕様
                },
            },
            // 特定管理口座
            tkKanriKoza: {
                TKTEI_KANRI_KOZA_MSKM:{
                    applyName: 'TKTEI_KANRI_KOZA_MSKM', // 項目の共通領域名
                    id: 'chkboxTkteiKanriKozaMskm', // 画面項目id
                    name: '開設', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [['isEmpty'], [checkTkteiKanriKozaMskm]], // 一括チェック仕様
                },
            },
            // 加入者情報拡張登録
            kaNyu: {
                KANYUSY_EXP_TORK_K:{
                    applyName: 'KANYUSY_EXP_TORK_K', // 項目の共通領域名
                    id: 'chkboxKanyusyExpTorkK', // 画面項目id
                    name: '拡張情報', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [['isEmpty']], // 一括チェック仕様
                },
            },
            // NISA口座開設
            nisa: {
                NISA_KOZA_MSKM: {
                    applyName: 'NISA_KOZA_MSKM', // 項目の共通領域名
                    id: 'radioNisa', // 画面項目id
                    name: 'NISA口座開設', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [['isEmpty'], [checkNisaKozaMskm1]], // 一括チェック仕様
                },
                HIREIHAIBUN: {
                    applyName: 'HIREIHAIBUN', // 項目の共通領域名
                    id: 'chkboxHireihaibun', // 画面項目id
                    name: '株式数比例配分方式申込', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [[checkNisaKozaHireihaibun]], // 一括チェック仕様
                },
            },
            // 個人番号告知
            myNumber: {
                MYNO_KOKUCHI: {
                    applyName: 'MYNO_KOKUCHI', // 項目の共通領域名
                    id: 'chkboxMynoKokuchi', // 画面項目id
                    name: '個人番号の登録', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [['isEmpty']], // 一括チェック仕様
                },
            },
            // お受取口座（追加分）、動的に追加するため、削除しないでください
            kozaAdd:{},
            // 利金・分配金支払方法（包括）
            suknHoukatsu:{
                SUKN_HKT_AZKR: {
                    applyName: 'SUKN_HKT_AZKR', // 項目の共通領域名
                    id: 'radioSuknHoukatsu', // 画面項目id
                    name: '支払方法', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [['isEmpty'], [checkSuknHktAzkrWithNoAc]], // 一括チェック仕様
                },
                SUKN_HKT_TRKNO:{
                    applyName: 'SUKN_HKT_TRKNO', // 項目の共通領域名
                    id: 'txtSuknHktTrkno', // 画面項目id
                    name: '登録銀行No.', // 画面項目名
                    typeSelect: false, // 入力項目タイプ
                    length: 2, // 最大文字数
                    numPad: true, // 数字キーボード
                    onBlurChk: [['isNum']], // 随時入力チェック仕様（フォーカス外し時）
                    allChk: [[checkSuknHktTrknoIsEmpty], ['isNum', 'chkSameLength'], [checkSuknHktTrkno1, checkSuknHktTrkno2, checkSuknHktTrkno3, checkSuknHktTrkno5, checkSuknHktTrkno7]], // 一括チェック仕様
                }
            },
            // 利金・分配金支払方法（銘柄）
            suknMeigara: {
                SUKN_HKT_MEIG_K: {
                    applyName: 'SUKN_HKT_MEIG_K', // 項目の共通領域名
                    id: 'chkboxSuknHktK', // 画面項目id
                    name: '利金・分配金支払方法（銘柄）', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [['isEmpty'], [checkSuknHktMeigk]], // 一括チェック仕様
                },
            },
            // 外国証券の円貨利金分配金振込銀行
            gaikSukn:{
                GAIK_SYKN_YEN_SUKN_AZKR: {
                    applyName: 'GAIK_SYKN_YEN_SUKN_AZKR', // 項目の共通領域名
                    id: 'radioGaikSukn', // 画面項目id
                    name: '支払方法', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [['isEmpty'], [checkGaikSyknYenSuknAzkrNasi]] // 一括チェック仕様
                },
                GAIK_SYKN_YEN_SUKN_BK:{
                    applyName: 'GAIK_SYKN_YEN_SUKN_BK', // 項目の共通領域名
                    id: 'txtGaikSyknYen', // 画面項目id
                    name: '登録銀行No.', // 画面項目名
                    typeSelect: false, // 入力項目タイプ
                    length: 2, // 最大文字数
                    numPad: true, // 数字キーボード
                    onBlurChk: [['isNum']], // 随時入力チェック仕様（フォーカス外し時）
                    allChk: [[checkGaikSyknYenSuknBkIsEmpty], ['isNum', 'chkSameLength'], [checkGaikSyknYenSuknBk1, checkGaikSyknYenSuknBk2, checkGaikSyknYenSuknBk3, checkGaikSyknYenSuknBk4, checkGaikSyknYenSuknBk5]], // 一括チェック仕様
                }
            },
            // 累投（株投型）分配金買付停止
            ruiTouSunk:{
                RUITOU_SUKN_KAIT_TEIS_K: {
                    applyName: 'RUITOU_SUKN_KAIT_TEIS_K', // 項目の共通領域名
                    id: 'radioRuiTouSunk', // 画面項目id
                    name: '支払方法', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [['isEmpty'], [checkRuitouSuknKaitTeisk]], // 一括チェック仕様
                },
                RUITOU_SUKN_TRKNO:{
                    applyName: 'RUITOU_SUKN_TRKNO', // 項目の共通領域名
                    id: 'txtRuitouSuknTrkno', // 画面項目id
                    name: '登録銀行No.', // 画面項目名
                    typeSelect: false, // 入力項目タイプ
                    length: 2, // 最大文字数
                    numPad: true, // 数字キーボード
                    onBlurChk: [['isNum']], // 随時入力チェック仕様（フォーカス外し時）
                    allChk: [[checkRuitouSuknTrknoIsEmpty], ['isNum', 'chkSameLength'], [checkRuitouSuknTrkno1, checkRuitouSuknTrkno2, checkRuitouSuknTrkno3, checkRuitouSuknTrkno4, checkRuitouSuknTrkno5]], // 一括チェック仕様
                }
            },
            // 配当金受領方式
            haitkinSunk:{
                HAITKN_SYKN_UKTR_MSKM: {
                    applyName: 'HAITKN_SYKN_UKTR_MSKM', // 項目の共通領域名
                    id: 'radioHaitkinSunk', // 画面項目id
                    name: '申込区分', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [['isEmpty'], [checkHaitknSyknUktrMskm]], // 一括チェック仕様
                },
                AMEIG_FURIKOMI_CHK: {
                    applyName: 'AMEIG_FURIKOMI_CHK', // 項目の共通領域名
                    id: 'checkHaitkinSunk', // 画面項目id
                    name: '受取方法', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [[checkAmeigFurikomiChkIsEmpty]], // 一括チェック仕様
                },
                AMEIG_FURIKOMI:{
                    applyName: 'AMEIG_FURIKOMI', // 項目の共通領域名
                    id: 'txtAmeigFurikomi', // 画面項目id
                    name: '登録銀行No.', // 画面項目名
                    typeSelect: false, // 入力項目タイプ
                    length: 2, // 最大文字数
                    numPad: true, // 数字キーボード
                    onBlurChk: [[checkAmeigFurikomiIsNum]], // 随時入力チェック仕様（フォーカス外し時）
                    allChk: [[checkAmeigFurikomiIsEmpty], [checkAmeigFurikomiIsNum, checkAmeigFurikomiSameLength], [checkAmeigFurikomiIsAllowed, checkAmeigFurikomi1, checkAmeigFurikomi2, checkAmeigFurikomi3, checkAmeigFurikomi4, checkAmeigFurikomi5]], // 一括チェック仕様
                }
            },
        };

        // ------------------------------------ ここから内部処理メッソド START ------------------------------------ //

        /**
         * 初期化処理
         */
        var init = function () {
            initPullDwon();
            initRadioList();
            initDataAndFlg();
            initMsg();
        };

        /**
         * プルダウン項目の初期化処理
         */
        var initPullDwon = function () {
            // 都道府県リスト
            $scope.tDFKList = AppBizCom.MstData.getCodeMstDataByKbn('TDFKN_C');
            // 元号リスト
            $scope.gnGoList = AppBizCom.MstData.getCodeMstDataByKbn('GNGO_K');
            // 西暦区分を保持
            tnkyGngoAD = ($scope.gnGoList.find(e => e.STM1 == '0') || {}).CD;
            // 預金区分リスト
            var tmpBkYokkndList = AppBizCom.MstData.getCodeMstDataByKbn('BK_YOKNKND');
            $scope.bkYokkndList = tmpBkYokkndList.filter(function(val, index) {
                return val.STM1 != '1';
            });
        };

        /**
         * ラジオボタン項目の初期化処理
         */
        var initRadioList = function () {
            // 日興カード申込区分
            $scope.snkKjySaihkList = mstList2RadioList(AppBizCom.MstData.getCodeMstDataByKbn('SNK_KJY_SAIHK_K'));
            // 特定口座申込区分
            $scope.kstHnkHaisList = mstList2RadioList(AppBizCom.MstData.getCodeMstDataByKbn('KST_HNK_HAIS_K'));
            // 配当金受領方式申込区分
            $scope.mskNhksList = mstList2RadioList(AppBizCom.MstData.getCodeMstDataByKbn('MSK_HNK_K'));
        };

        /**
         * マスタデータより画面表示用Mapデータを作成
         * @param {string} mstList - マスタデータリスト
         * @param {string} label - ディフォルト値「'MSY'」
         * @param {string} value - ディフォルト値「'CD'」
         * 
         */
        var mstList2RadioList = function (mstList: Array<any>, label = 'MSY', value = 'CD') {
            return mstList.map(function (e) { return { label: e[label], value: e[value] } });
        };

        /**
         * 各画面項目および画面制御フラグの初期化処理
         */
        var initDataAndFlg = function () {

            //　共通領域からデータを取得
            var customerInfo = AppBizCom.DataHolder.getCustomer() || {};
            var notifInfo = AppBizCom.DataHolder.getNotifInfo() || {};
            var modifyFlgInfo = AppBizCom.DataHolder.getFlowControlFlg() || {};

            // 画面用スコープオブジェクトに設定する
            // 変更前データ
            copyDataWithDefine(beforeEditDataDefine, customerInfo, $scope);

            // 事務手続き情報
            copyDataWithDefine(notifInfoDefine, notifInfo.JIMU_JOHO || {}, $scope);

            // 入力画面遷移制御フラグ(振込先口座削除・追加以外)
            var modifyFlgGetter = function (func, val) { return getDefault(val, '0'); };
            copyDataWithDefine(modifyFlgDefine, modifyFlgInfo.INPUT_FLG_CONTROL || {}, $scope, modifyFlgGetter);

            // 振込先口座削除フラグ
            $scope.kozaModifyFlg = (modifyFlgInfo.INPUT_FLG_CONTROL || {}).KOZA_DEL_F;
            if (!$scope.kozaModifyFlg || !angular.isArray($scope.kozaModifyFlg)) {
                $scope.kozaModifyFlg = new Array($scope.kozaBefore.KOZA.length).fill(undefined);
            }
            // 当社から送金する際のお受取口座(削除分)
            $scope.kozaDel = angular.copy($scope.kozaModifyFlg);

            // 画面項目表示フラグを初期化
            // 確認画面から戻るを示すフラグ
            $scope.isFromConfirmPageFlg = !!$routeParams.prev;
            // 住所不明フラグ
            $scope.isAddressUnkown = customerInfo.JSYFMI == '1';
            // 個人番号未告知フラグ
            $scope.isMyNumberNotNotice = customerInfo.MYNO_KKC == '0';

            // 変更する（日興MRF累積投資口座（証券総合口座取引））ボタン非表示フラグ
            $scope.isMrfNoChg = customerInfo.NIKKO_MRF != '0';
            // 変更する（外国証券取引口座）ボタン非表示フラグ
            $scope.isGaikSyknKozaNoChg = customerInfo.GAIK_SYKN_KOZA_OPENYMD != stringConst.ZeroYMD;
            // 変更する（特定管理口座）ボタン非表示フラグ
            $scope.istkTeiKanriKozaNoChg = customerInfo.TKTEI_KANRI_KOZA_OPENYMD != stringConst.ZeroYMD || customerInfo.TKTEI_KOZA_OPENYMD == stringConst.ZeroYMD;
            // 変更する（加入者情報拡張登録）ボタン非表示フラグ
            $scope.isKaNyuNoChg = [customerInfo.KAKU_KYAKNM_KNJ, customerInfo.KAKU_YUBINNO, customerInfo.KAKU_ADDR].every(e => e == undefined || (angular.isString(e) && e.trim().length == 0));
            // 変更する（NISA口座開設）ボタン非表示フラグ
            $scope.isNisaNoChg = customerInfo.NISA_KOZA_OPENYMD != stringConst.ZeroYMD;
            // 変更する（個人番号告知）ボタン非表示フラグ
            $scope.isMyNumberNoChg = customerInfo.MYNO_KKC == '1';
            // 変更する（利金・分配金支払方法（銘柄））ボタン非表示フラグ
            // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
			// 顧客契約情報の利金・分配金支払方法銘柄包括指定区分（SUKN_SITEI_K）が"1：個別"、または"3：包括＆銘柄"以外、
			// またはホスト帳票閲覧店権限管理チェック結果が"0：ホスト帳票閲覧店権限なし"の場合、
			//「利金・分配金支払方法（銘柄）」の変更するボタンを非表示にする。
            $scope.isSuknHoukatsuMeigNoChg = (customerInfo.SUKN_SITEI_K != '1' && customerInfo.SUKN_SITEI_K != '3') || customerInfo.CHOHYO_ETRN_CHK =='0';
            // 変更する（当社から送金する際のお受取口座）ボタン非表示フラグ
            $scope.isUktrkzNoChg = customerInfo.CHOHYO_ETRN_CHK =='0'
            // 変更する（利金・分配金支払方法（包括））ボタン非表示フラグ
            $scope.isSuknHoukatsuNoChg = customerInfo.CHOHYO_ETRN_CHK =='0'
            // 変更する（外国証券の円貨利金分配金振込銀行）ボタン非表示フラグ
            $scope.isGaikSyknYenNoChg = customerInfo.CHOHYO_ETRN_CHK =='0'
            // 変更する（累投（株投型）分配金買付停止）ボタン非表示フラグ
            $scope.isRuitouSyknKaitTeisNoChg = customerInfo.CHOHYO_ETRN_CHK =='0'
            // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913
            // 当社から送金する際のお受取口座登録済み０件の場合、タイトル表示フラグ
            $scope.isNoAcTitle = customerInfo.KOZA.length == '0';

            // // 変更する（外国証券の円貨利金分配金振込銀行）ボタン非表示フラグ
            // // 外国証券の円貨利金分配金振込銀行”包括なし””銘柄なし”状態の場合、支払方法の選択は全て不可となるため ”変更する”ボタンを非表示にする。
            // var gaikSyknYenSuknBkHktBeforeIsNasi = ($scope.gaikSunkBefore.GAIK_SYKN_YEN_SUKN_BK_HKT == stringConst.Nasi) ? true : false;
            // var gaikSyknYenSuknBkMeigBeforeIsNasi = ($scope.gaikSunkBefore.GAIK_SYKN_YEN_SUKN_BK_MEIG_NASI) ? true : false;
            // $scope.isGaikSuknNoChg = (gaikSyknYenSuknBkHktBeforeIsNasi && gaikSyknYenSuknBkMeigBeforeIsNasi) ? true : false;

            // 特定口座源徴予約日・予約情報　表示・非表示制御
            var gyomuYyyy = new Date(gyomuDate).getFullYear(); // 業務日付（年）
            var tkteiKozaYyyy = customerInfo.TKTEI_KOZA_YYKYMD.slice(0, 4); // 特定口座源徴予約日（年）
            var tkteiKozaYykymd = customerInfo.TKTEI_KOZA_YYKYMD.replace(/(\d{4})(\d{2})(\d{2})/, '$1年 $2月 $3日');  // 特定口座源徴予約日（出力仕様）
            if (gyomuYyyy == tkteiKozaYyyy) {
                // ③「源泉徴収予約日」が当年の場合は、
                var tmpTkteiKozaYyk = getNmWithCd(customerInfo.TKTEI_KOZA_YYK, 'GNSEN_TYOSYU_K');
                // 【予約情報】に「源泉徴収予約日」を表示する
                // 「源泉徴収予約区分」が1ならば【予約情報】に「源泉徴収あり」を追加出力する
                // 「源泉徴収予約区分」が1以外ならば【予約情報】に「源泉徴収なし」を追加出力する
                $scope.tkKozaBefore.TKTEI_KOZA_YYK_NM = tkteiKozaYykymd + '　' + tmpTkteiKozaYyk;
            } else {
                // 「源泉徴収予約日」が当年でなければ【予約情報】は空を設定する
                $scope.tkKozaBefore.TKTEI_KOZA_YYK_NM = '';
            }

            // 特定口座年初取引　表示・非表示制御
            $scope.tkKozaBefore.TKTEI_KOZA_NENSY_TORIHIKIYMD = '';
            var tmpTorihikiYmd = customerInfo.TKTEI_KOZA_NENSY_TORIHIKIYMD;
            // 特定口座開設済みの場合
            if (stringConst.ZeroYMD != customerInfo.TKTEI_KOZA_OPENYMD) {
                // 特定口座年初取引の（年）当年の場合、「あり」と表示する。
                if (angular.isString(tmpTorihikiYmd) && tmpTorihikiYmd.slice(0, 4) == new Date(gyomuDate).getFullYear().toString()) {
                    $scope.tkKozaBefore.TKTEI_KOZA_NENSY_TORIHIKIYMD = 'あり';
                } 
                // 特定口座年初取引は「''」（空）ではない場合、「確認要」と表示する。
                else if (tmpTorihikiYmd != '') {
                    $scope.tkKozaBefore.TKTEI_KOZA_NENSY_TORIHIKIYMD = '確認要';
                }
                // 上記以外の場合、「''」と表示する。
                else {
                    $scope.tkKozaBefore.TKTEI_KOZA_NENSY_TORIHIKIYMD = '';
                }
            }

            // 住所③続けて入力表示フラグ
            $scope.addr.isShowAddr3KanjiInput = $scope.addr.KYAK_HOUSENM_KNJS.reduce(function (acc, cur, idx) {
                return (cur != undefined && idx > 0) ? acc + Math.pow(2, idx) : acc;
            }, 1);
            // 住所③フリガナ続けて入力表示フラグ
            $scope.addr.isShowAddr3KanaInput = $scope.addr.KYAK_HOUSENM_KANAS.reduce(function (acc, cur, idx) {
                return (cur != undefined && idx > 0) ? acc + Math.pow(2, idx) : acc;
            }, 1);

            // 画面表示項目デフォルト値マップ（変更取消時、項目クリア処理に使う）
            $scope.addrDefaultMap = { KYAK_ADDR_FLAG: '0', isShowAddr3KanjiInput: 1, isShowAddr3KanaInput: 1, KYAK_HOUSENM_KNJS: new Array(3), KYAK_HOUSENM_KANAS: new Array(3) };
            $scope.telsDefaultMap = { TELNO_DEL: undefined, MOBILE_TELNO_DEL: undefined, FAXNO_DEL: undefined };
            $scope.mrfDefaultMap = { NIKKO_MRF: undefined};
            $scope.nisaDefaultMap = { HIREIHAIBUN: undefined };
            $scope.gaikSyknKozaDefaultMap = { GAIK_SYKN_KOZA: undefined};
            $scope.tkKanriKozaDefaultMap = { TKTEI_KANRI_KOZA_MSKM: undefined};
            $scope.myNumberDefaultMap = { MYNO_KOKUCHI: undefined};
            $scope.kozaDelDefaultMap = undefined;

            // 画面入力項目定義をスコープへ設定
            $scope.inputData = angular.copy(inputData);
        };

        /**
         * 注意喚起文言の初期化処理
         */
        var initMsg = function () {
            $scope.getMsg = function (msgId) {
                return (AppBizCom.Msg.getMsg(msgId, undefined));
            };
        };

        /**
         * オブジェクトコピー処理
         * @param {string} define - 定義用オブジェクト
         * @param {string} fromData - 共通領域データ
         * @param {string} toObject - コピー先
         * @param {string} defualtGetter - 出力編集処理用コールバック関数、ディフォルト値「undefined」
         * @return {any} - コピー結果オブジェクト
         * 
         */
        var copyDataWithDefine = function (define, fromData, toObject, defualtGetter = undefined) {
            var getter = angular.isFunction(defualtGetter) ? defualtGetter : function (func: Function, val, params) {
                var args = params ? [val].concat(params) : [val];
                return func && angular.isFunction(func) ? func.apply(null, args) : val;
            };

            Object.keys(define).forEach(key => {
                toObject[key] = {};
                define[key].forEach(item => {

                    var func = undefined;
                    var params = undefined;
                    var subkey = item;
                    var target = item;

                    if (angular.isObject(item) && item.target && angular.isObject(item.get)) {
                        target = item.target;
                        subkey = item.key !== undefined ? item.key : item.target;
                        var getterDef = item.get;

                        if (angular.isArray(getterDef) && getterDef.length > 0 && angular.isFunction(getterDef[0])) {
                            func = getterDef[0];
                            params = getterDef.slice(1);
                        } else if (angular.isFunction(getterDef)) {
                            func = getterDef;
                        }
                    }

                    if (angular.isArray(fromData[target]) || angular.isObject(fromData[target])) {
                        toObject[key][subkey] = getter(func, angular.copy(fromData[target]), params);
                    } else {
                        toObject[key][subkey] = getter(func, fromData[target], params);
                    }

                });
            });
        };

        /**
         * 住所検索CallBack
         * @param {string} status - コールバック状態
         * @param {string} addrSrhRes - 住所検索結果
         * 
         */
        var addrSrhCallBack = function (status, addrSrhRes) {
            // 選択をタップ時
            if (status == '1' && addrSrhRes) {
                // 郵便番号・地域コード・住所①（ラベル）を更新
                $scope.addr.YUBINNO_1 = addrSrhRes.zipcodeup;
                $scope.addr.YUBINNO_2 = addrSrhRes.zipcodedown;
                $scope.addr.TIIKI_C = addrSrhRes.tiiki_cd;
                $scope.addr.KYAK_ADDR_KNJ = addrSrhRes.address;
                $scope.addr.KYAK_ADDR_KANA = addrSrhRes.addresskana;
            }
            isBtnClickedFlg = false;
            
            // 「郵便番号検索結果住所」のエラーをクリアする
            clearlblAddr1_Error();
            // ご住所チェック: ご住所①～ご住所③追加2の最大108文字の相関チェック
            checkAddrsMaxLength(false);
            // ご住所チェック: ご住所①カナ～ご住所③カナ追加2の最大100文字（半角文字に変換後）の相関チェック
            checkAddrKanasMaxLength(false);
        };

        /**
         * 金融機関・支店検索CallBack
         * @param {string} status - コールバック状態
         * @param {string} srhRes - 金融機関・支店検索結果
         * @param {string} idx - インデックス
         * @param {string} scopeId - 口座追加分ID
         * @param {string} isBranchOnly - 支店検索のみフラグ
         * 
         */
        var bankBranchSrhCallBack = function (status, srhRes, idx, scopeId, isBranchOnly) {
            // 「支店検索」確定をタップ時
            if (status == '2') {
                // 金融機関コード・金融機関名称・支店コード・支店名称を更新
                !isBranchOnly && ($scope.kozaAdd.KOZA[idx].KOZA_BK_C_ADD_BK = srhRes.orgCode);
                !isBranchOnly && ($scope.kozaAdd.KOZA[idx].KOZA_BK_NM = srhRes.orgName);
                !isBranchOnly && clearErrorGroup('searchBank_' + scopeId);
                $scope.kozaAdd.KOZA[idx].KOZA_MISE_C_ADD_BK = srhRes.branchCode;
                $scope.kozaAdd.KOZA[idx].KOZA_BK_MISE_NM = srhRes.branchName;
                clearErrorGroup('searchBranch_' + scopeId);
                var tmpErr = $('[data-msgid].KOZA_ADD_FS_' + idx).attr("data-msgid") === 'KKAP-SFJ06-12E';
                tmpErr && clearErrorGroup('KOZA_ADD_FS_' + idx);
            }
            isBtnClickedFlg = false;
        };

        /**
         * 共通領域保存処理
         */
        var setNotifInfo = function(){
            var notifInfo = AppBizCom.DataHolder.getNotifInfo();
            var flowControlFlg = AppBizCom.DataHolder.getFlowControlFlg();
            var jimuJohoDefine = appDefine.offerDetailData.JIMU_JOHO;
            var inputFlgControlDefine = appDefine.pageJumpFlg.INPUT_FLG_CONTROL;

            // おなまえ情報
            var nameJimuJoho = '1' == $scope.modifyFlg.KYAKNM_F ? AppLgcApplyAssign.objAssign(jimuJohoDefine, $scope.name) : {};

            if ('1' == $scope.modifyFlg.KYAK_ADDR_F) {
                // 郵便番号
                var YUBINNO = [$scope.addr.YUBINNO_1, $scope.addr.YUBINNO_2];
                $scope.addr.YUBINNO = YUBINNO.join('');
                // 都道府県
                $scope.addr.KYAK_ADDR_TDHKN = '0' == $scope.addr.KYAK_ADDR_FLAG ? '' : $scope.addr.KYAK_ADDR_TDHKN;
                // ご住所①（都道府県）
                $scope.addr.KYAK_ADDR_KNJ = '0' == $scope.addr.KYAK_ADDR_FLAG ? $scope.addr.KYAK_ADDR_KNJ : getFromCodeList($scope.addr.KYAK_ADDR_TDHKN, $scope.tDFKList, '', 'MSY', 'CD');
                // ご住所①カナ（都道府県）
                $scope.addr.KYAK_ADDR_KANA = '0' == $scope.addr.KYAK_ADDR_FLAG ? $scope.addr.KYAK_ADDR_KANA : getFromCodeList($scope.addr.KYAK_ADDR_TDHKN, $scope.tDFKList, '', 'STM1', 'CD');
                // 建物名漢字
                var tmpAddr3 = $scope.addr.KYAK_HOUSENM_KNJS.filter(e => e != undefined && e != '');
                $scope.addr.KYAK_HOUSENM_KNJ = tmpAddr3.join('　');
                // 建物名フリガナ
                var tmpAddr3Kana = $scope.addr.KYAK_HOUSENM_KANAS.filter(e => e != undefined && e != '');
                $scope.addr.KYAK_HOUSENM_KANA = tmpAddr3Kana.join('　');
                // 転居日
                if ('1' == $scope.tkKozaBefore.TKTEI_KOZA_GNSN) {
                    $scope.addr.TNKYYMD = [padLeft($scope.addr.TNKYY, 2), padLeft($scope.addr.TNKYM, 2), padLeft($scope.addr.TNKYD, 2)].join('');
                }
            }
            // ご住所情報
            var addrJimuJoho = '1' == $scope.modifyFlg.KYAK_ADDR_F ? AppLgcApplyAssign.objAssign(jimuJohoDefine, $scope.addr) : {};

            // 電話番号情報
            var telsJimuJoho = '1' == $scope.modifyFlg.TELNO_F ? AppLgcApplyAssign.objAssign(jimuJohoDefine, $scope.tels) : {};
            if (AppBizCom.InputCheck.isEmpty(telsJimuJoho.TELNO_DEL)) {
                telsJimuJoho.TELNO_DEL = '0';
            }
            if (AppBizCom.InputCheck.isEmpty(telsJimuJoho.MOBILE_TELNO_DEL)) {
                telsJimuJoho.MOBILE_TELNO_DEL = '0';
            }
            if (AppBizCom.InputCheck.isEmpty(telsJimuJoho.FAXNO_DEL)) {
                telsJimuJoho.FAXNO_DEL = '0';
            }

            // 日興MRF情報
            var mrfJimuJoho = '1' == $scope.modifyFlg.NIKKO_MRF_F ? AppLgcApplyAssign.objAssign(jimuJohoDefine, $scope.mrf) : {};

            // 日興カード情報
            var nkCardJimuJoho = '1' == $scope.modifyFlg.NIKKO_CARD_F ? AppLgcApplyAssign.objAssign(jimuJohoDefine, $scope.nkCard) : {};
            //・日興カードの申込区分で「2:解除」が選択されている場合、
　　        //「日興カード暗証番号」および「日興カード申し込み確認区分」をクリア（undifined）する。
            var pinJoho = angular.isObject(notifInfo.PIN_JOHO) ? angular.copy(notifInfo.PIN_JOHO) : {}
            if ('2' == nkCardJimuJoho.NIKKO_CARD) {
                pinJoho.NIKKO_CARD_PIN = undefined;
                pinJoho.NIKKO_CARD_MSKM_K = undefined;
            }

            // 日興イージートレード情報
            var ezTradeJimuJoho = '1' == $scope.modifyFlg.NIKKO_EZ_F ? AppLgcApplyAssign.objAssign(jimuJohoDefine, $scope.ezTrade) : {};

            // 外国証券取引口座情報
            var gaikSyknKozaJimuJoho = '1' == $scope.modifyFlg.GAIK_SYKN_KOZA_F ? AppLgcApplyAssign.objAssign(jimuJohoDefine, $scope.gaikSyknKoza) : {};

            // 特定口座情報
            var tkKozaJimuJoho = '1' == $scope.modifyFlg.TKTEI_KOZA_F ? AppLgcApplyAssign.objAssign(jimuJohoDefine, $scope.tkKoza) : {};

            // 特定管理口座情報
            var tkKanriKozaJimuJoho = '1' == $scope.modifyFlg.TKTEI_KANRI_KOZA_F ? AppLgcApplyAssign.objAssign(jimuJohoDefine, $scope.tkKanriKoza) : {};

            // 加入者情報拡張登録情報
            var kaNyuJimuJoho = '1' == $scope.modifyFlg.KANYUSY_EXP_F ? AppLgcApplyAssign.objAssign(jimuJohoDefine, $scope.kaNyu) : {};

            // NISA口座開設情報
            var nisaJimuJoho = '1' == $scope.modifyFlg.NISA_KOZA_F ? AppLgcApplyAssign.objAssign(jimuJohoDefine, $scope.nisa) : {};

            // 個人番号告知情報
            var myNumberJimuJoho = '1' == $scope.modifyFlg.MYNO_KOKUCHI_F ? AppLgcApplyAssign.objAssign(jimuJohoDefine, $scope.myNumber) : {};
            // 変更あり（おなまえ）かつ個人番号が事前未告知、
            // 変更あり（ご住所）かつ番号確認書類「持参あり」、(事前告知済かつ番号確認書類「持参あり」の場合番号確認が必要でも、個人番号告知の状態が更新不要)
            // || ('1' == $scope.modifyFlg.KYAK_ADDR_F && '1' == $scope.addr.MNSYSEIRY_JISN_FLAG)
            // 変更あり（ご住所）かつ個人番号が事前未告知、
            // 変更あり（特定口座）「開設」の場合かつ個人番号が事前未告知、
            // 変更あり（NISA口座）かつ個人番号が事前未告知、
            // 上記任意の場合：個人番号告知情報を「1：告知する」で更新
            if (('1' == $scope.modifyFlg.KYAKNM_F && '1' != $scope.myNumberBefore.MYNO_KKC)
                || ('1' == $scope.modifyFlg.KYAK_ADDR_F && '1' != $scope.myNumberBefore.MYNO_KKC)
                || ('1' == $scope.modifyFlg.TKTEI_KOZA_F && '1' == $scope.tkKoza.TKTEI_KOZA_MSKM && '1' != $scope.myNumberBefore.MYNO_KKC)
                || ('1' == $scope.modifyFlg.NISA_KOZA_F && '1' != $scope.myNumberBefore.MYNO_KKC) ) {
                myNumberJimuJoho.MYNO_KOKUCHI = '1';
            }

            // 入力画面遷移制御.振込先口座[X].振込先口座削除フラグ
            var delKozaJimuJoho = [];

            // 2020/11/19 インシデント対応 追加開始
            var delKozaTrkNoList = [];  // 振込先口座の登録番号を一覧として保持する配列
            var delKozaTrkNoListObj = {};  // 上記配列を共通領域に保存させるためのオブジェクト
            // 2020/11/19 インシデント対応 追加終了

            for (var i = 0; i < $scope.kozaBefore.KOZA.length; i++) {
                if ('1' != $scope.kozaDel[i]) {
                    delKozaJimuJoho.push(undefined);
                } else {
                    delKozaJimuJoho.push('1');

                    // 2020/11/19 インシデント対応 追加開始
                    // 対象の登録Noを配列に保存する
                    delKozaTrkNoList.push($scope.kozaBefore.KOZA[i].KOZA_TRKNO);
                    // 2020/11/19 インシデント対応 追加終了
                }
            }

            // 2020/11/19 インシデント対応 追加開始
            // 共通領域に保存するためにデータ整形
            delKozaTrkNoListObj[appDefine.offerDetailData.JIMU_JOHO.DEL_KOZA_TORK_NO_LIST] = delKozaTrkNoList;
            var delKozaTrkNoListJoho = 0 != delKozaTrkNoList.length ? AppLgcApplyAssign.objAssign(jimuJohoDefine, delKozaTrkNoListObj) : {};
            // 2020/11/19 インシデント対応 追加終了

            // 追加口座情報
            var addKozaJimuJoho = 0 < $scope.kozaAdd.KOZA.length ? AppLgcApplyAssign.objAssign(jimuJohoDefine, $scope.kozaAdd) : {};

            // 利金・分配金（包括）情報
            var suknHoukatsuJimuJoho = '1' == $scope.modifyFlg.SUKN_HKT_F ? AppLgcApplyAssign.objAssign(jimuJohoDefine, $scope.suknHoukatsu) : {};

            // 利金・分配金（銘柄）情報
            var suknMeigaraJimuJoho = '1' == $scope.modifyFlg.SUKN_HKT_MEIG_F ? AppLgcApplyAssign.objAssign(jimuJohoDefine, $scope.suknMeigara) : {};

            // 外証情報
            var gaikSuknJimuJoho = '1' == $scope.modifyFlg.GAIK_SYKN_YEN_F ? AppLgcApplyAssign.objAssign(jimuJohoDefine, $scope.gaikSukn) : {};

            // 累投情報
            var ruiTouSunkJimuJoho = '1' == $scope.modifyFlg.RUITOU_SUKN_KAIT_TEIS_F ? AppLgcApplyAssign.objAssign(jimuJohoDefine, $scope.ruiTouSunk) : {};

            // 配当金情報
            var haitkinSunkJimuJoho = '1' == $scope.modifyFlg.HAITKN_SYKN_UKTR_F ? AppLgcApplyAssign.objAssign(jimuJohoDefine, $scope.haitkinSunk) : {};

            // 変更フラグ情報
            var modifyFlgJoho = AppLgcApplyAssign.objAssign(inputFlgControlDefine, $scope.modifyFlg);
            modifyFlgJoho.KOZA_DEL_F = angular.copy(delKozaJimuJoho); // 振込先口座削除フラグ
            modifyFlgJoho.BK_KOZA_ADD_F = '0'; // 振込先銀行登録フラグ
            modifyFlgJoho.YUCH_KOZA_ADD_F = '0'; // 振込先ゆうちょ登録フラグ

            for (var i = 0; i < $scope.kozaAdd.KOZA.length; i++) {
                // 三井住友銀行またはその他金融機関の場合：「1：登録あり」
                if ('1' == $scope.kozaAdd.KOZA[i].KOZA_KBN || '3' == $scope.kozaAdd.KOZA[i].KOZA_KBN) {
                    modifyFlgJoho.BK_KOZA_ADD_F = '1';
                }
                // ゆうちょ銀行の場合：「1：登録あり」
                if ('2' == $scope.kozaAdd.KOZA[i].KOZA_KBN) {
                    modifyFlgJoho.YUCH_KOZA_ADD_F = '1';
                }
            }
            // 変更あり（おなまえ）かつ個人番号が事前未告知、
            // 変更あり（ご住所）かつ番号確認書類「持参あり」、(事前告知済かつ番号確認書類「持参あり」の場合番号確認が必要でも、個人番号告知の状態が更新不要)
            // || ('1' == $scope.modifyFlg.KYAK_ADDR_F && '1' == $scope.addr.MNSYSEIRY_JISN_FLAG)
            // 変更あり（ご住所）かつ個人番号が事前未告知、
            // 変更あり（特定口座）「開設」の場合かつ個人番号が事前未告知、
            // 変更あり（NISA口座）かつ個人番号が事前未告知、
            // 上記任意の場合：個人番号告知フラグを「1」で更新
            if (('1' == $scope.modifyFlg.KYAKNM_F && '1' != $scope.myNumberBefore.MYNO_KKC)
                || ('1' == $scope.modifyFlg.KYAK_ADDR_F && '1' != $scope.myNumberBefore.MYNO_KKC)
                || ('1' == $scope.modifyFlg.TKTEI_KOZA_F && '1' == $scope.tkKoza.TKTEI_KOZA_MSKM && '1' != $scope.myNumberBefore.MYNO_KKC)
                || ('1' == $scope.modifyFlg.NISA_KOZA_F && '1' != $scope.myNumberBefore.MYNO_KKC)) {
                modifyFlgJoho.MYNO_KOKUCHI_F = '1'; // 個人番号告知フラグ
            }

            notifInfo.JIMU_JOHO = Object.assign(
                nameJimuJoho,
                addrJimuJoho,
                telsJimuJoho,
                mrfJimuJoho,
                nkCardJimuJoho,
                ezTradeJimuJoho,
                gaikSyknKozaJimuJoho,
                tkKozaJimuJoho,
                tkKanriKozaJimuJoho,
                kaNyuJimuJoho,
                nisaJimuJoho,
                myNumberJimuJoho,
                addKozaJimuJoho,
                suknHoukatsuJimuJoho,
                suknMeigaraJimuJoho,
                gaikSuknJimuJoho,
                ruiTouSunkJimuJoho,
                // 2020/11/19 インシデント対応 削除開始
                //haitkinSunkJimuJoho);
                // 2020/11/19 インシデント対応 削除終了
                // 2020/11/19 インシデント対応 追加開始
                haitkinSunkJimuJoho,
                delKozaTrkNoListJoho
                );
                // 2020/11/19 インシデント対応 追加終了

            notifInfo.PIN_JOHO = Object.assign(pinJoho);
            AppBizCom.DataHolder.setNotifInfo(notifInfo);

            flowControlFlg.INPUT_FLG_CONTROL = angular.copy(modifyFlgJoho);
            AppBizCom.DataHolder.setFlowControlFlg(flowControlFlg);
        }

        /**
         * 次ページ情報取得
         */
        var getNxtPageInfo = function(){
            if ($scope.isFromConfirmPageFlg){
                // G1240-01:お客様確認画面」から遷移してきた場合（「確認画面へ」ボタンタップ）、「G1240-01:お客様確認画面」へ遷移する
                return {id: $scope.Const.confrimPageID , pageUrl: 'applicationConfirm'};
            } else if ([$scope.modifyFlg.KYAK_ADDR_F, $scope.modifyFlg.KYAKNM_F, $scope.modifyFlg.NISA_KOZA_F, $scope.modifyFlg.MYNO_KOKUCHI_F].some(e => e == '1')){
                  // 変更項目に以下の項目が含まれる場合、「G1090-01:番号確認書類撮影開始画面」へ遷移する
                  // ・ 住所変更                           ・ 氏名変更
                  // ・ NISA口座開設
                  // ・ 個人番号告知
                  return {id: $scope.Const.selectIdDespPageID , pageUrl: 'selectIdentificationDescription'};
            } else if ($scope.modifyFlg.TKTEI_KOZA_F == '1' && $scope.tkKoza.TKTEI_KOZA_MSKM == '1'){
                  // 変更項目に以下の項目が含まれる場合、「G1090-01:番号確認書類撮影開始画面」へ遷移する
                  // ・ 特定口座（開設）
                  return {id: $scope.Const.selectIdDespPageID , pageUrl: 'selectIdentificationDescription'};
            } else {
                // 変更項目は以下の項目のみの場合、「G1220-01:申込内容確認開始画面」へ遷移する。
                // ・ 電話番号                                                        ・ 加入者情報拡張登録
                // ・ 日興MRF累積投資口座（証券総合口座取引）（申し込み）             ・ 当社から送金する際のお受取口座
                // ・ 日興カード                                                      ・ 利金・分配金支払方法（包括）
                // ・ 日興イージートレード                                            ・ 利金・分配金支払方法（銘柄）
                // ・ 外国証券引取口座                                                ・ 外証の利金分配金振込銀行
                //・ 特定口座（変更・廃止）                                           ・ 累投（株投型）分配金買付停止
                // ・ 特定管理口座（開設）                                             ・ 配当金受取方法
                return {id: $scope.Const.confrimStartPageID , pageUrl: 'applicationConfirmStart'};
            }
        }

        // ------------------------------------ ここから内部処理メッソド END ------------------------------------ //

        // ------------------------------------ ここからスコープ処理メッソド START ------------------------------------ //

        // スコープ定数定義
        $scope.Const = {
            EmptyString: '',
            FullSpace: '　',
            homePageID:'G1040-01',
            PageID: 'G1080-01',
            addrsrchPageID: 'G1080-03',
            banksrchPageID: 'G1080-04',
            brancdsrchPageID: 'G1080-05',
            stopConfrimPageID: 'G1080-23',
            errPageID:'G1080-24',
            confrimPageID: 'G1240-01',
            confrimStartPageID: 'G1220-01',
            selectIdDespPageID: 'G1090-01'
        };

        /**
         * 画面描画後にスクロールリセット、確認画面から戻る時、修正項目へスクロールする
         */
        $scope.$on('$viewContentLoaded', function () {
            $timeout(function () {
                $anchorScroll.yOffset = 0;
                $routeParams.scrollId ? $anchorScroll($routeParams.scrollId) : $anchorScroll();
            }, 0);
        });

        /**
         * 「次へ」ボタン活性、非活性制御処理
         */
        $scope.btnDisabledChk = function() {
            // ディフォルト状態は非活性
            var tmpFlg = true;
            // 「変更する」ボタン（当社から送金する際のお受取口座の削除・追加分以外）が任意一つ押されたら、活性化にする
            for (var key in $scope.modifyFlg) {
                if ($scope.modifyFlg[key] == '1') {
                    tmpFlg = false;
                    break;
                }
            }
            // 当社から送金する際のお受取口座「追加」ボタンが一つ押されたら、活性化にする
            if ($scope.kozaAdd.KOZA && $scope.kozaAdd.KOZA.length > 0) {
                tmpFlg = false;
            }
            // 当社から送金する際のお受取口座（削除分）の「変更する」ボタンが一つ押されたら、活性化にする
            if ($scope.kozaModifyFlg) {
                for (var key in $scope.kozaModifyFlg) {
                    if ($scope.kozaModifyFlg[key] == '1') {
                        tmpFlg = false;
                        break;
                    }
                }
            }
            return tmpFlg;
        }

        /**
         * 住所入力モード切り替え時の制御処理
         */
        $scope.addrInputModeChg = function () {

            // フラグを逆にする
            $scope.addr.KYAK_ADDR_FLAG == '0' ? ($scope.addr.KYAK_ADDR_FLAG = '1') : ($scope.addr.KYAK_ADDR_FLAG = '0');
            var linkName = $scope.addr.KYAK_ADDR_FLAG == '0' ? '郵便番号から住所を入力する場合はこちら' : '郵便番号から住所を入力できない場合はこちら';
            logicCom.btnTapLog($scope.Const.PageID, $scope.Const.PageID, linkName);

            // 郵便番号（３桁）、郵便番号（４桁）をクリアする
            $scope.addr.YUBINNO_1 = undefined;
            $scope.addr.YUBINNO_2 = undefined;
            clearYubinNo1_Error();
            clearYubinNo2_Error();

            // 都道府県、ご住所①、ご住所①カナ、地域コードをクリアする
            $scope.addr.KYAK_ADDR_TDHKN = undefined;
            $scope.addr.KYAK_ADDR_KNJ = undefined;
            $scope.addr.KYAK_ADDR_KANA = undefined;
            $scope.addr.TIIKI_C = undefined;
            clearpldAddrTDFK_Error();
            clearlblAddr1_Error();

            // ご住所②、ご住所②カナをクリアする
            $scope.addr.KYAK_HOSK_ADDR_KNJ = undefined;
            $scope.addr.KYAK_HOSK_ADDR_KANA = undefined;
            clearAddr2_1Error();
            clearAddrKana2_1Error();

            // ご住所③～ご住所③追加２、ご住所③カナ～ご住所③カナ追加２をクリアする
            $scope.addr.KYAK_HOUSENM_KNJS = [];
            $scope.addr.KYAK_HOUSENM_KANAS = [];
            clearAddr3_1Error();
            clearAddr3_2Error();
            clearAddr3_3Error();
            clearAddrKana3_1Error();
            clearAddrKana3_2Error();
            clearAddrKana3_3Error();

            // ご住所③～ご住所③追加2の最大52文字の相関チェックエラークリア（漢字）
            clearAddr3s_Error();
            // ご住所③～ご住所③追加2とご住所③カナ～ご住所③カナ追加2の相関チェックエラークリア（漢字）
            clearAddr3s2_Error();
            // ご住所③カナ～ご住所③カナ追加2の最大48文字（半角文字に変換後）の相関チェックエラークリア（カナ）
            clearAddr3ks_Error();
            // ご住所③～ご住所③追加2とご住所③カナ～ご住所③カナ追加2の相関チェックエラークリア（カナ）
            clearAddr3ks2_Error();
            // ご住所①～ご住所③追加2の最大108文字の相関チェックエラークリア（漢字）
            clearAddrs_Error();
            // ご住所①カナ～ご住所③カナ追加2の最大100文字（半角文字に変換後）の相関チェックエラークリア（カナ）
            clearAddrks_Error();

            // DOM要素（テキストボックス）のvalueクリア
            $("#txtAddr2_1").val('');
            $("#txtAddrKana2_1").val('');
            $("#txtAddr3_1").val('');
            $("#txtAddr3_2").val('');
            $("#txtAddr3_3").val('');
            $("#txtAddrKana3_1").val('');
            $("#txtAddrKana3_2").val('');
            $("#txtAddrKana3_3").val('');
        };

        /**
         * 「住所検索」ボタンタップ時
         */
        $scope.addrSrhBtnClick = function () {

            // ２重クリックを防止
            if (isBtnClickedFlg) {
                return;
            } else {
                isBtnClickedFlg = true;
            }

            // 郵便番号入力チェック
            var addrForChk: any = {};
            addrForChk.YUBINNO_1 = {};
            addrForChk.YUBINNO_2 = {};

            Object.assign(addrForChk.YUBINNO_1, angular.copy(inputData.addr.YUBINNO_1));
            Object.assign(addrForChk.YUBINNO_2, angular.copy(inputData.addr.YUBINNO_2));
            addrForChk.YUBINNO_2.allChk.shift(); // 郵便番号（４桁）の必須チェックを外す

            // エラーメッセージをクリア
            clearErrorGroup(addrForChk.YUBINNO_1.id);
            clearErrorGroup(addrForChk.YUBINNO_2.id);

            // 郵便番号入力チェックを行う
            var chkResult = AppLgcMultiCheck.multiInputCheck(addrForChk, $scope.addr);
            var msgParam = chkResult[1];

            if (!chkResult[0]) {
                // アクションログ出力
                logicCom.btnTapLog($scope.Const.PageID, $scope.Const.addrsrchPageID, '住所検索');
                // 住所検索
                $scope.zipcodeSearch($scope.Const.PageID, $scope.Const.addrsrchPageID, $scope.addr.YUBINNO_1, $scope.addr.YUBINNO_2, addrSrhCallBack);

            } else {
                isBtnClickedFlg = false;
                // 入力チェックエラー時アクションログ出力
                logicCom.btnTapErrLog($scope.Const.PageID, $scope.Const.PageID, '住所検索', msgParam);
            }
        };

        /**
         * 都道府県選択変更時
         */
        $scope.plAddrTDFKChg = function(){
            // 住所関連チェックお行う
            clearpldAddrTDFK_Error();
            $scope.addr.TIIKI_C = getFromCodeList($scope.addr.KYAK_ADDR_TDHKN, $scope.tDFKList, '', 'STM2', 'CD');

            // ご住所チェック: ご住所①～ご住所③追加2の最大108文字の相関チェック
            checkAddrsMaxLength(false);
            // ご住所チェック: ご住所①カナ～ご住所③カナ追加2の最大100文字（半角文字に変換後）の相関チェック
            checkAddrKanasMaxLength(false);
        }

        /**
         * 転居日選択(元号)選択変更時
         */
        $scope.tnkyGngoChg = function(){

            // 転居日（元号）相関チェック残っているメッセージをクリア
            clearTnkyGengoError();
            
            // チェック行う
            var checkResults = [checkTnkyGengoYear(), checkTnykMonthFromTo(), checkTnykDayFromTo()];
            checkResults.every(e => e == undefined) && checkTnykGengoYearMonthDay();
        };

        /**
         * 住所③．住所③のフリガナ「続けて入力」、「続けて入力を削除する」ボタンタップ
         * @param {string} mod モード　0:続けて入力　1：続けて入力を削除する
         * @param {string} targetFlg 処理対象フラグ
         * @param {string} targeData 処理対象データ
         * 
         */
        $scope.addrInputButtonClick = function (mod, targetFlg, targeData) {
            // ２重クリックを防止
            if (isBtnClickedFlg) {
                return;
            }
            else {
                isBtnClickedFlg = true;
            }
            var logBtnName = 'ご住所③';
            'isShowAddr3KanaInput' == targetFlg && (logBtnName = 'ご住所③のフリガナ');
            if (mod){
                logicCom.btnTapLog($scope.Const.PageID, $scope.Const.PageID, `続けて入力を削除する（${logBtnName}）`)
            } else {
                logicCom.btnTapLog($scope.Const.PageID, $scope.Const.PageID, `続けて入力（${logBtnName}）`)
            }
            
            var idx = undefined;
            for(var i = 2; i >= 0; i--){
                if ($scope.addr[targetFlg] & Math.pow(2, i)) {
                    idx = i;
                    break;
               }
            }

            switch (mod) {
                case 0:
                    // 続けて入力
                    $scope.addr[targetFlg] = $scope.addr[targetFlg] + Math.pow(2, idx + 1);
                    break;
                case 1:
                    // 続けて入力を削除する
                    $scope.addr[targetFlg] = $scope.addr[targetFlg] - Math.pow(2, idx);
                    $scope.addr[targeData][idx] = undefined;
                    break;
            }

            if (targeData == 'KYAK_HOUSENM_KANAS') {
                // ご住所チェック: ご住所③カナ～ご住所③カナ追加2の最大48文字（半角文字に変換後）の相関チェック
                checkAddrKana3MaxLength(false);
                // ご住所チェック: ご住所①カナ～ご住所③カナ追加2の最大100文字（半角文字に変換後）の相関チェック
                checkAddrKanasMaxLength(false);
                // ご住所チェック: ご住所③～ご住所③追加2とご住所③カナ～ご住所③カナ追加2の相関チェック
                checkAddr3AndKana3(false);
            }

            if (targeData == 'KYAK_HOUSENM_KNJS') {
                // ご住所チェック: ご住所③～ご住所③追加2の最大52文字の相関チェック
                checkAddr3MaxLength(false);
                // ご住所チェック: ご住所①～ご住所③追加2の最大108文字の相関チェック
                checkAddrsMaxLength(false);
                // ご住所チェック: ご住所③～ご住所③追加2とご住所③カナ～ご住所③カナ追加2の相関チェック
                checkAddr3AndKana3(false);
            }

            isBtnClickedFlg = false;
        };

        // ご住所②合計桁数チェックについて、任意単項目が空文字列「''」になる場合の相関チェック
        $scope.$watch(function() {
            return $scope.addr.KYAK_HOSK_ADDR_KNJ;
        }, function (newValue, oldValue) {
            // ご住所チェック: ご住所①～ご住所③追加2の最大108文字の相関チェック
            newValue != oldValue && checkAddrsMaxLength(false);
        }, true);

        // ご住所②のフリガナ合計桁数チェックについて、任意単項目が空文字列「''」になる場合の相関チェック
        $scope.$watch(function() {
            return $scope.addr.KYAK_HOSK_ADDR_KANA;
        }, function (newValue, oldValue) {
            // ご住所チェック: ご住所①カナ～ご住所③カナ追加2の最大100文字（半角文字に変換後）の相関チェック
            newValue != oldValue && checkAddrKanasMaxLength(false);
        }, true);

        // ご住所③合計桁数チェックについて、任意単項目が空文字列「''」になる場合の相関チェック
        $scope.$watch(function() {
            return $scope.addr.KYAK_HOUSENM_KNJS;
        }, function (newValue, oldValue) {
            // ご住所チェック: ご住所③～ご住所③追加2の最大52文字の相関チェック
            newValue != oldValue && checkAddr3MaxLength(false);
            // ご住所チェック: ご住所①～ご住所③追加2の最大108文字の相関チェック
            newValue != oldValue && checkAddrsMaxLength(false);
            // ご住所チェック: ご住所③～ご住所③追加2とご住所③カナ～ご住所③カナ追加2の相関チェック
            newValue != oldValue && checkAddr3AndKana3(false);
        }, true);

        // ご住所③のフリガナ合計桁数チェックについて、任意単項目が空文字列「''」になる場合の相関チェック
        $scope.$watch(function() {
            return $scope.addr.KYAK_HOUSENM_KANAS;
        }, function (newValue, oldValue) {
            // ご住所チェック: ご住所③カナ～ご住所③カナ追加2の最大48文字（半角文字に変換後）の相関チェック
            newValue != oldValue && checkAddrKana3MaxLength(false);
            // ご住所チェック: ご住所①カナ～ご住所③カナ追加2の最大100文字（半角文字に変換後）の相関チェック
            newValue != oldValue && checkAddrKanasMaxLength(false);
            // ご住所チェック: ご住所③～ご住所③追加2とご住所③カナ～ご住所③カナ追加2の相関チェック
            newValue != oldValue && checkAddr3AndKana3(false);
        }, true);

        // ご自宅電話番号グループ、全項目が空になる時に、エラークリア
        ['tels.TELNO1', 'tels.TELNO2', 'tels.TELNO3'].forEach((e, index) => {
            $scope.$watch(e, function (newValue, oldValue) {
                if (newValue !== oldValue && (newValue == undefined || newValue == '')) {
                    if (AppBizCom.InputCheck.isEmpty($scope.tels.TELNO1) && 
                        AppBizCom.InputCheck.isEmpty($scope.tels.TELNO2) && 
                        AppBizCom.InputCheck.isEmpty($scope.tels.TELNO3)) {
                        clearErrorGroup('txtTelno1');
                        clearErrorGroup('txtTelno2');
                        clearErrorGroup('txtTelno3');
                        clearTelGroupError();
                    }
                };
            });
        });

        // 携帯電話番号グループ、全項目が空になる時に、エラークリア
        ['tels.MOBILE_TELNO1', 'tels.MOBILE_TELNO2', 'tels.MOBILE_TELNO3'].forEach((e, index) => {
            $scope.$watch(e, function (newValue, oldValue) {
                if (newValue !== oldValue && (newValue == undefined || newValue == '')) {
                    if (AppBizCom.InputCheck.isEmpty($scope.tels.MOBILE_TELNO1) && 
                        AppBizCom.InputCheck.isEmpty($scope.tels.MOBILE_TELNO2) && 
                        AppBizCom.InputCheck.isEmpty($scope.tels.MOBILE_TELNO3)) {
                        clearErrorGroup('txtMobileTelno1');
                        clearErrorGroup('txtMobileTelno2');
                        clearErrorGroup('txtMobileTelno3');
                        clearMobileGroupError();
                    }
                };
            });
        });

        // FAX番号グループ、全項目が空になる時に、エラークリア
        ['tels.FAXNO1', 'tels.FAXNO2', 'tels.FAXNO3'].forEach((e, index) => {
            $scope.$watch(e, function (newValue, oldValue) {
                if (newValue !== oldValue && (newValue == undefined || newValue == '')) {
                    if (AppBizCom.InputCheck.isEmpty($scope.tels.FAXNO1) && 
                        AppBizCom.InputCheck.isEmpty($scope.tels.FAXNO2) && 
                        AppBizCom.InputCheck.isEmpty($scope.tels.FAXNO3)) {
                        clearErrorGroup('txtFaxno1');
                        clearErrorGroup('txtFaxno2');
                        clearErrorGroup('txtFaxno3');
                        clearFaxGroupError();
                    }
                };
            });
        });

        /**
         * 電話番号「抹消」チェックボックスタップ
         * @param {string} target 該当項目 0: ご自宅電話番号、1: 携帯電話番号、2: FAX番号
         * @param {string} val 該当抹消チェックボックスの値
         * 
         */
        $scope.clearNo = function (target, val) {

            // 抹消がチェックされた時
            if (val == '1') {
                switch (target) {
                    case 0:
                        // ご自宅電話番号
                        $scope.tels.TELNO1 = undefined;
                        $scope.tels.TELNO2 = undefined;
                        $scope.tels.TELNO3 = undefined;
                        clearTelGroupError(false);
                        break;
                    case 1:
                        // 携帯電話番号
                        $scope.tels.MOBILE_TELNO1 = undefined;
                        $scope.tels.MOBILE_TELNO2 = undefined;
                        $scope.tels.MOBILE_TELNO3 = undefined;
                        clearMobileGroupError(false);
                        break;
                    case 2:
                        // FAX番号
                        $scope.tels.FAXNO1 = undefined;
                        $scope.tels.FAXNO2 = undefined;
                        $scope.tels.FAXNO3 = undefined;
                        clearFaxGroupError(false);
                        break;
                }
            } else {
                switch (target) {
                    case 0:
                        // ご自宅電話番号
                        clearErrorGroup('chkboxTelDel');
                        clearErrorGroup('chkboxMobileTelDel');
                        break;
                    case 1:
                        // 携帯電話番号
                        clearErrorGroup('chkboxTelDel');
                        clearErrorGroup('chkboxMobileTelDel');
                        break;
                    case 2:
                        // FAX番号
                        clearErrorGroup('chkboxFaxnoDel');
                        break;
                }
            }
        };

        /**
         * 年初住所選択変更時
         */
        $scope.$watch(function () {
            return $scope.addr.NENSY_JSY;
        }, function (newValue, oldValue) {
            if (newValue !== oldValue) {
                // 年初住所相関チェック残っているメッセージをクリア
                // 単項目チェックエラークリア
                clearNensyJsyError();
                // 相関チェックエラークリア（相関チェック対象：特定口座 年初住所）
                nensyJsyGloupErrorClear();
                // もう一度チェックする
                checkNensyIsSame(false);
            }
        });

        /**
         * ご住所または特定口座変更エリアを閉じる時に、年初住所相関チェックエラーをクリアする
         */
        $scope.ezTokuteiSoukanItems = function(){
            // ご住所エリアの年初住所相関チェックエラーをクリアする
            // 特定口座エリアの年初住所相関チェックエラーをクリアする
            nensyJsyGloupErrorClear();
        };

        /**
         * 特定口座 申込区分選択変更時
         * @param {string} val 選択値
         * 
         */
        $scope.tkTeiKozaMskmChg = function (val) {
            $scope.tkKoza.TKTEI_KOZA_AC = undefined;
            $scope.tkKoza.TKTEI_KOZA_GNSN = undefined;
            $scope.tkKoza.TKTEI_KOZA_YYK = undefined;
            $scope.tkKoza.TKTEI_KOZA_NENSY_JSY = undefined;
            clearErrorGroup('radioTkkozaAC');
            clearErrorGroup('radioTkkozaGNSN');
            clearErrorGroup('radioTkKozaYYK');
            clearErrorGroup('pldTkteiKozaNensy');
            clearErrorGroup('TKTEI_KOZA_F');
        };

        /**
         * 特定口座 勘定区分選択変更時
         * @param {string} val 選択値
         * 
         */
        $scope.tkTeiKozaAcChg = function (val) {
            // 源泉徴収変更予約をクリア
            if (val !== undefined) {
                $scope.tkKoza.TKTEI_KOZA_YYK = undefined;
                clearErrorGroup('TKTEI_KOZA_F');
            }
        };

        /**
         * 特定口座 特定口座源泉徴収選択・配当等受入 選択変更時
         * @param {string} val 選択値
         * 
         */
        $scope.tkTeiKozaGnsnChg = function (val) {

            if (val !== undefined) {
                // 源泉徴収変更予約をクリア
                $scope.tkKoza.TKTEI_KOZA_YYK = undefined;

                clearErrorGroup('TKTEI_KOZA_F');

                if('1' != val){
                    clearErrorGroup('pldTkteiKozaNensy');
                }
                // 顧客契約情報.特定口座源徴区分が「1：源泉徴収あり＆特定口座配当等通算」以外の場合、
                // ご住所の転居日、年初住所をクリア
                if ($scope.tkKozaBefore.TKTEI_KOZA_GNSN != '1') {
                    $scope.addr.TNKY_GNGO = undefined;
                    $scope.addr.TNKYY = undefined;
                    $scope.addr.TNKYM = undefined;
                    $scope.addr.TNKYD = undefined;
                    $scope.addr.NENSY_JSY = undefined;
                    clearTnkyGengoError();
                    clearTnkyYearError();
                    clearTnkyMonthError();
                    clearTnkyDayError();
                    clearTnkyGengoYearError();
                    clearTnkyError();
                    clearErrorGroup('pldTkteiKozaNensy');
                }
            }
        };

        /**
         * 特定口座 源泉徴収変更予約選択変更時
         * @param {string} val 選択値
         * 
         */
        $scope.tkTeiKozaYykChg = function (val) {
            // 特定口座源泉徴収、勘定区分をクリア
            if (val !== undefined) {
                $scope.tkKoza.TKTEI_KOZA_AC = undefined;
                $scope.tkKoza.TKTEI_KOZA_GNSN = undefined;
                clearErrorGroup('TKTEI_KOZA_F');
                clearErrorGroup('radioTkkozaAC');
                clearErrorGroup('radioTkkozaGNSN');
                clearErrorGroup('pldTkteiKozaNensy');
            }
        };

        /**
         * 特定口座 年初住所選択変更時
         */
        $scope.$watch(function () {
            return $scope.tkKoza.TKTEI_KOZA_NENSY_JSY;
        }, function (newValue, oldValue) {
            if (newValue !== oldValue) {
                // 特定口座 年初住所相関チェック残っているメッセージをクリア
                // 単項目チェックエラークリア
                clearErrorGroup('pldTkteiKozaNensy');
                // 相関チェックエラークリア（相関チェック対象：ご住所 年初住所）
                nensyJsyGloupErrorClear();
                // もう一度チェックする
                checkNensyIsSame(false);
            }
        });

        /**
         * 当社から送金する際のお受取口座 削除選択変更時
         */
        $scope.$watchCollection('kozaDel', function (newArr: Array<string>, oldArrr: Array<string>,) {
            // 口座未削除数
            $scope.kozaDelCount = newArr.filter(e => e != '1').length;
            // 口座数チェック
            newArr !== oldArrr && checkKozaCount();
        });

        /**
         * お受取口座を追加する タップ時
         */
        $scope.kozaAddClick = function () { 

            logicCom.btnTapLog($scope.Const.PageID, $scope.Const.PageID, 'お受取口座を追加する');

            $scope.kozaAdd.KOZA.push({
                KOZA_TORK_K: '1',
                KOZA_KBN: undefined,
                KOZA_TORK_NO: undefined,
                KOZA_UKTRKZ: undefined,
                KOZA_BK_C_ADD_BK: undefined,
                KOZA_MISE_C_ADD_BK: undefined,
                KOZA_BK_NM: undefined,
                KOZA_BK_MISE_NM: undefined,
                BK_YOKNKND: undefined,
                BK_KOZA_CD: undefined,
                YUCH_BK_C: undefined,
                YUCH_BK_KOZA_CD: undefined,
            });
        };

        /**
         * お受取口座を追加する 初期化処理
         * @param {any} kozaInfo 口座情報
         * @param {string} scopeId 口座追加分ID
         * @param {string} idx インデックス
         * 
         */
        $scope.koazaAddInit = function(kozaInfo, scopeId, idx){
            kozaInfo.scopeId = scopeId;

            $scope.inputData.kozaAdd[idx] = {
                KOZA_KBN:{
                    applyName: 'KOZA_KBN', // 項目の共通領域名
                    id: 'radioKozaUktrkz_' + scopeId, // 画面項目id
                    name: 'お受取口座', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [['isEmpty'], [() => checkKozaCountAllCheck(idx, scopeId)]], // 一括チェック仕様
                },
                KOZA_BK_NM:{
                    applyName: 'KOZA_BK_NM', // 項目の共通領域名
                    id: 'searchBank_' + scopeId, // 画面項目id
                    name: '金融機関', // 画面項目名
                    typeSelect: false, // 入力項目タイプ
                    allChk: [[() => checkKozaBkNm(idx, scopeId)]], // 一括チェック仕様
                },
                KOZA_BK_MISE_NM:{
                    applyName: 'KOZA_BK_MISE_NM', // 項目の共通領域名
                    id: 'searchBranch_' + scopeId, // 画面項目id
                    name: '支店', // 画面項目名
                    typeSelect: false, // 入力項目タイプ
                    allChk: [[() => checkKozaBkMiseNm(idx, scopeId)]], // 一括チェック仕様
                },
                KOZA_YOKNKND_ADD_BK:{
                    applyName: 'KOZA_YOKNKND_ADD_BK', // 項目の共通領域名
                    id: 'txtYoKnKnd_' + scopeId, // 画面項目id
                    name: '預金種目', // 画面項目名
                    typeSelect: true, // 入力項目タイプ
                    allChk: [[() => checkKozaYoknkndAddBkIsEmpty(idx, scopeId)]], // 一括チェック仕様
                },
                KOZA_KOZA_CD_ADD_BK:{
                    applyName: 'KOZA_KOZA_CD_ADD_BK', // 項目の共通領域名
                    id: 'txtKozaNumber_' + scopeId, // 画面項目id
                    name: '口座番号', // 画面項目名
                    typeSelect: false, // 入力項目タイプ
                    numPad: true, // 数字キーボード
                    length: 7, // 最大文字桁数
                    onBlurChk: [[() => checkKozaNoIsNum(idx, scopeId)], [() => checkKozaNo(idx, scopeId)]], // 随時入力チェック仕様（フォーカス外し時）
                    allChk: [[() => kozaNoPadLeft(idx, scopeId), () => checkKozaNoIsEmpty(idx, scopeId)], [() => checkKozaNoIsNum(idx, scopeId), () => checkKozaNoSamlength(idx, scopeId)], [() => checkKozaNo(idx, scopeId)]], // 一括チェック仕様
                },
                KOZA_BK_C_ADD_YUCH:{
                    applyName: 'KOZA_BK_C_ADD_YUCH', // 項目の共通領域名
                    id: 'txtYuchBkC_' + scopeId, // 画面項目id
                    name: '記号', // 画面項目名
                    typeSelect: false, // 入力項目タイプ
                    numPad: true, // 数字キーボード
                    length: 5, // 最大文字桁数
                    onBlurChk: [[() => checkYuchoKigoIsNum(idx, scopeId)], [() => checkYuchoKigo(idx, scopeId)]], // 随時入力チェック仕様（フォーカス外し時）
                    allChk: [[() => yuchoKigoPadLeft(idx, scopeId), () => checkYuchoKigoIsEmpty(idx, scopeId)], [() => checkYuchoKigoIsNum(idx, scopeId), () => checkYuchoKigoSamlength(idx, scopeId)], [() => checkYuchoKigo(idx, scopeId)]], // 一括チェック仕様
                },
                YUCH_BK_KOZA_CD_ADD_YUCH:{
                    applyName: 'YUCH_BK_KOZA_CD_ADD_YUCH', // 項目の共通領域名
                    id: 'txtYuchBkKozaCd_' + scopeId, // 画面項目id
                    name: '通帳番号', // 画面項目名
                    typeSelect: false, // 入力項目タイプ
                    numPad: true, // 数字キーボード
                    length: 8, // 最大文字桁数
                    onBlurChk: [[() => checkYuchoNoIsNum(idx, scopeId)], [() => checkYuchoNo(idx, scopeId)]], // 随時入力チェック仕様（フォーカス外し時）
                    allChk: [[() => yuchoNoPadLeft(idx, scopeId), () => checkYuchoNoIsEmpty(idx, scopeId)], [() => checkYuchoNoIsNum(idx, scopeId), () => checkYuchoNoSamlength(idx, scopeId)], [() => checkYuchoNo(idx, scopeId)]], // 一括チェック仕様
                },
            };
        }

        /**
         * お受取口座 選択変更時
         * @param {string} val 選択値
         * @param {string} index インデックス
         * @param {string} scopeId 口座追加分ID
         * 
         */
        $scope.kozaKbnChg = function (val, index, scopeId) {
            // エラーをクリア
            clearErrorGroup('radioKozaUktrkz_' + scopeId);
            clearErrorGroup('searchBank_' + scopeId);
            clearErrorGroup('searchBranch_' + scopeId);
            clearErrorGroup('txtYoKnKnd_' + scopeId);
            clearErrorGroup('txtKozaNumber_' + scopeId);
            clearErrorGroup('txtYuchBkC_' + scopeId);
            clearErrorGroup('txtYuchBkKozaCd_' + scopeId);
            var tmpErr = $('[data-msgid].KOZA_ADD_FS_' + index).attr("data-msgid") === 'KKAP-SFJ06-12E';
            tmpErr && clearErrorGroup('KOZA_ADD_FS_' + index);

            // 保存する情報をクリア
            $scope.kozaAdd.KOZA[index].KOZA_TORK_NO = undefined;
            $scope.kozaAdd.KOZA[index].KOZA_UKTRKZ = undefined;
            $scope.kozaAdd.KOZA[index].KOZA_BK_C_ADD_BK = undefined;
            $scope.kozaAdd.KOZA[index].KOZA_BK_NM = undefined;
            $scope.kozaAdd.KOZA[index].KOZA_MISE_C_ADD_BK = undefined;
            $scope.kozaAdd.KOZA[index].KOZA_BK_MISE_NM = undefined;
            $scope.kozaAdd.KOZA[index].KOZA_YOKNKND_ADD_BK = undefined;
            $scope.kozaAdd.KOZA[index].KOZA_KOZA_CD_ADD_BK = undefined;

            $scope.kozaAdd.KOZA[index].KOZA_BK_C_ADD_YUCH = undefined;
            $scope.kozaAdd.KOZA[index].YUCH_BK_KOZA_CD_ADD_YUCH = undefined;

            switch (val) {
                case '1':
                    // 三井住友銀行
                    $scope.kozaAdd.KOZA[index].KOZA_UKTRKZ = '1'; // 受取口座
                    $scope.kozaAdd.KOZA[index].KOZA_TORK_NO = '20'; // 登録銀行No
                    $scope.kozaAdd.KOZA[index].KOZA_BK_C_ADD_BK = '0009'; // 金融機関コード
                    $scope.kozaAdd.KOZA[index].KOZA_BK_NM = '三井住友銀行'; // 銀行名

                    $scope.kozaAdd.KOZA[index].BK_KOZA_ADD_F = '1';
                    $scope.kozaAdd.KOZA[index].YUCH_KOZA_ADD_F = '0';
                    break;
                case '3':
                    // その他金融機関
                    $scope.kozaAdd.KOZA[index].KOZA_UKTRKZ = '3'; // 受取口座
                    $scope.kozaAdd.KOZA[index].KOZA_TORK_NO = '20'; // 登録銀行No

                    $scope.kozaAdd.KOZA[index].BK_KOZA_ADD_F = '1';
                    $scope.kozaAdd.KOZA[index].YUCH_KOZA_ADD_F = '0';
                    break;
                case '2':
                    // ゆうちょ銀行
                    $scope.kozaAdd.KOZA[index].KOZA_UKTRKZ = '2'; // 受取口座
                    $scope.kozaAdd.KOZA[index].KOZA_TORK_NO = '30'; // 登録銀行No
                    $scope.kozaAdd.KOZA[index].KOZA_BK_NM = 'ゆうちょ銀行'; // 銀行名

                    $scope.kozaAdd.KOZA[index].BK_KOZA_ADD_F = '0';
                    $scope.kozaAdd.KOZA[index].YUCH_KOZA_ADD_F = '1';

                    // 相関チェックエラークリア
                    var tmpErr2 = $('[data-msgid].KOZA_ADD_FS_0').attr("data-msgid") === 'KKAP-SFJ06-08E';
                    tmpErr2 && clearErrorGroup('KOZA_ADD_FS_0');
                    tmpErr2 && clearErrorGroup('KOZA_ADD_FS_1');
                    break;
            }

            // 規定値チェック
            checkKozaCount();
        };

        /**
         * 金融機関検索タップ時
         * @param {string} index インデックス
         * @param {string} scopeId 口座追加分ID
         * 
         */
        $scope.bankSrhBtnClick = function (index, scopeId) {

            // ２重クリックを防止
            if (isBtnClickedFlg) {
                return;
            } else {
                isBtnClickedFlg = true;
            }

            // アクションログ出力
            logicCom.btnTapLog($scope.Const.PageID, $scope.Const.banksrchPageID, '金融機関を検索');
            // 金融機関検索
            $scope.searchFacilityBtnClick($scope.Const.PageID, $scope.Const.banksrchPageID, $scope.Const.brancdsrchPageID, bankBranchSrhCallBack, index, scopeId, false);
        };

        /**
         * 支店検索タップ時
         * @param {string} index インデックス
         * @param {string} scopeId 口座追加分ID
         * 
         */
        $scope.branchSrhBtnClick = function (index, scopeId) {

            // ２重クリックを防止
            if (isBtnClickedFlg) {
                return;
            } else {
                isBtnClickedFlg = true;
            }

            // アクションログ出力
            logicCom.btnTapLog($scope.Const.PageID, $scope.Const.brancdsrchPageID, '支店を検索');
            // 金融機関検索
            $scope.searchBranch(
                $scope.kozaAdd.KOZA[index].KOZA_BK_C_ADD_BK,
                $scope.kozaAdd.KOZA[index].KOZA_BK_NM,
                $scope.Const.PageID,
                $scope.Const.brancdsrchPageID,
                bankBranchSrhCallBack,
                [index, scopeId, true]
            );
        };
        
        /**
         * 預金種類変更時の「既に登録済みエラー」クリア処理
         * @param {string} index インデックス
         * @param {string} scopeId 口座追加分ID
         * 
         */
        var oldTxtYoKnKnd = {}; // 預金種類入力値
        $scope.clearTxtYoKnKnd = function(index, scopeId){
            var newTxtYoKnKnd = $scope.kozaAdd.KOZA[index].KOZA_YOKNKND_ADD_BK;
            var tmpErr = $('[data-msgid].KOZA_ADD_FS_' + index).attr("data-msgid") === 'KKAP-SFJ06-12E';
            newTxtYoKnKnd !== oldTxtYoKnKnd[scopeId] && tmpErr && clearErrorGroup('KOZA_ADD_FS_' + index);
            oldTxtYoKnKnd[scopeId] = newTxtYoKnKnd;
        }

        /**
         * 口座番号変更時の「既に登録済みエラー」クリア処理
         * @param {string} index インデックス
         * @param {string} scopeId 口座追加分ID
         * 
         */
        var oldTxtKozaNumber = {}; // 口座番号入力値
        $scope.clearTxtKozaNumber = function (index, scopeId) {
            var newTxtKozaNumber = $scope.kozaAdd.KOZA[index].KOZA_KOZA_CD_ADD_BK;
            var tmpErr = $('[data-msgid].KOZA_ADD_FS_' + index).attr("data-msgid") === 'KKAP-SFJ06-12E';
            newTxtKozaNumber !== oldTxtKozaNumber[scopeId] && tmpErr && clearErrorGroup('KOZA_ADD_FS_' + index);
            oldTxtKozaNumber[scopeId] = newTxtKozaNumber;
        };

        /**
         * お受取口座を削除する タップ時
         * @param {string} index 削除するお受取口座のIndex
         * 
         */
        $scope.kozaDelClick = function (index) {

            delete oldTxtYoKnKnd[$scope.kozaAdd.KOZA[index].scopeId];
            delete oldTxtKozaNumber[$scope.kozaAdd.KOZA[index].scopeId];

            // ２重クリックを防止
            if (isBtnClickedFlg) {
                return;
            } else {
                isBtnClickedFlg = true;
            }

            logicCom.btnTapLog($scope.Const.PageID, $scope.Const.PageID, 'お受取口座を削除する');

            // 一番目の追加エリアを廃棄する時に、一番目の追加エリアのscopeIdを回避する
            var tmpScopeId;
            if (index == 0 && $scope.kozaAdd.KOZA.length > 1) {
                tmpScopeId = $scope.kozaAdd.KOZA[1].scopeId;
            }

            $scope.kozaAdd.KOZA.splice(index, 1);

            // 一番目の追加エリアを廃棄する時に、二番目の追加エリアが一番目になるので、scopeIdを更新する
            if ($scope.kozaAdd.KOZA.length > 0 && tmpScopeId) {
                $scope.koazaAddInit($scope.kozaAdd.KOZA[0], tmpScopeId, 0);
                var tmpErr2 = $('[data-msgid].KOZA_ADD_FS_1').attr("data-msgid") === 'KKAP-SFJ06-12E';
                tmpErr2 && $('[data-msgid].KOZA_ADD_FS_1').addClass('KOZA_ADD_FS_0');
                tmpErr2 && $('[data-msgid].KOZA_ADD_FS_1').removeClass('KOZA_ADD_FS_1');
            }
            
            // 口座数チェック
            checkKozaCount();
            // 相関チェックエラークリア
            var tmpErr = $('[data-msgid].KOZA_ADD_FS_0').attr("data-msgid") === 'KKAP-SFJ06-08E';
            tmpErr && clearErrorGroup('KOZA_ADD_FS_0');
            tmpErr && clearErrorGroup('KOZA_ADD_FS_1');

            isBtnClickedFlg = false;
        };

        /**
         * 利金・分配金支払方法（包括） 支払方法変更時
         * @param {string} val 選択値
         * 
         */
        $scope.suknHoukatsuChg = function (val) {
            $scope.suknHoukatsu.SUKN_HKT_TRKNO = undefined;
            clearErrorGroup('radioSuknHoukatsu');
            clearErrorGroup('txtSuknHktTrkno');
        };

        /**
         * 外国証券の円貨利金分配金振込銀行支払方法で 登録銀行No以外選択時
         * @param {string} index 支払方法のvalue
         */
        $scope.clearGaikNo = function(value){
            clearErrorGroup('GAIK_SYKN_YEN_F');
            clearErrorGroup('txtGaikSyknYen');
            if('0' != value){
                $scope.gaikSukn.GAIK_SYKN_YEN_SUKN_BK = undefined;
            }
        }

        /**
         * 累投（株投型）分配金買付停止 支払方法変更時
         * @param {string} val 選択値
         * 
         */
        $scope.ruiTouSunkChg = function (val) {
            $scope.ruiTouSunk.RUITOU_SUKN_TRKNO = undefined;
            clearErrorGroup('radioRuiTouSunk');
            clearErrorGroup('txtRuitouSuknTrkno');
        };

        /**
         * 配当金受領方式 申込区分選択変更時
         * @param {string} val 選択値
         * 
         */
        $scope.haitkinSunBunChg = function (val) {
            // 申込区分が「1: 申込」または「2: 変更」の場合
            if (val == '1' || val == '2') {
                // 受取方法がチェック済みの状態とする
                $scope.haitkinSunk.AMEIG_FURIKOMI_CHK = '1';
            } else {
                // 申込区分が「3: 抹消」の場合
                // 受取方法の入力値をクリアする
                $scope.haitkinSunk.AMEIG_FURIKOMI_CHK = undefined;
            }
            // 登録銀行Noの入力値をクリアする
            $scope.haitkinSunk.AMEIG_FURIKOMI = undefined;
            // 受取方法、登録銀行Noのエラーメッセージをクリアする
            clearErrorGroup('checkHaitkinSunk');
            clearErrorGroup('txtAmeigFurikomi');
        };

        var scrollUnlock = function(){
            $("body").removeClass('is-modal-open');
            $('.scrollArea').css({ '-webkit-overflow-scrolling': 'touch' });
        };
        var scrollLock = function(){
            $("body").addClass('is-modal-open');
            $('.scrollArea').css({ '-webkit-overflow-scrolling': 'auto' });
        };

        /**
         * 「次へ」または「確認画面へ」ボタンタップ
         */
        $scope.nextBtnClick = function(){

            // エラー項目表示画面のロードが完了ではない時、処理しない
            var errModal = $('#errItemModal');
            if (errModal.length == 0) return;

            // ２重クリックを防止
            if (isBtnClickedFlg) {
                return;
            } else {
                isBtnClickedFlg = true;
            }

            var btnName = $scope.isFromConfirmPageFlg ? '確認画面へ' : '次へ';
            var msgParam = {};

            // 一括チェックする前に、すべてのエラー情報をクリア
            AppBizCom.Msg.clearAllErrors();
    
            var hasError = doAllcheck();
            msgParam = hasError[1];

            if (hasError[0]){
                // エラー項目表示画面を表示
                $scope.errItemList = getUniqueList(hasError[2]);
                errModal.modal('show');
                scrollLock();
                // ログ出力
                logicCom.btnTapErrLog($scope.Const.PageID, $scope.Const.errPageID, btnName, msgParam);
                isBtnClickedFlg = false;
            } else {
                var successCallBack = function () {
                    // 共通領域保存処理
                    setNotifInfo();
                };
                var nxtPageInfo = getNxtPageInfo();
                // ログ出力
                logicCom.btnTapLog($scope.Const.PageID, nxtPageInfo.id, btnName, msgParam);
                // つぎページに遷移
                logicCom.locationPath(nxtPageInfo.pageUrl, successCallBack, emptyCallback, connectionErrorCallback);
            }
        }

        /**
         * 「中止する」ボタンタップ
         */   
        $scope.stopBtnClick = function(){
            // 表示画面のロードが完了ではない時、処理しない
            var stopConfrimModal = $('#G1080-23');
            if (stopConfrimModal.length == 0) return;

            // ２重クリックを防止
            if (isBtnClickedFlg) {
                return;
            } else {
                isBtnClickedFlg = true;
            }
            scrollLock();
            // ログ出力
            logicCom.btnTapLog($scope.Const.PageID, $scope.Const.stopConfrimPageID, '中止する');

            // 申込中止画面を表示
            stopConfrimModal.modal('show');
            isBtnClickedFlg = false;
        }

        /**
         * 関連チェック項目、値がundefined時、関連チェックエラーをクリアする
         */
        /**
         * おなまえ（漢字）姓・おなまえ（漢字）名変更時
         * @param {string} mod  0: 姓、1:名
         */
        var nameSeiMeiKanjiChg = function(mod){
            var val = mod == 0 ? $scope.name.KYAKNM_SEI_KNJ : $scope.name.KYAKNM_MEI_KNJ;
            if ((val == '' || val == undefined) && isPreCheckNameKanjiSeiMaxLegthError){

                // 該当項目の関連チェックを行う
                var chkFuns = [
                    [checkNameKanjiSeiMaxLegth],
                    [checkNameKanjiMeiMaxLegth],
                ];
                chkFuns[mod].forEach(func => func.apply(null));

            } else if (isPreCheckNameKanjiSeiMaxLegthError) {
                // 姓・名関連チェックエラー中、対応項目の変更フラグをTureにする
                mod == 0 ? isNameKanjiSeiChangeDuringMaxLengthCheck = true : isNameKanjiMeiChangeDuringMaxLengthCheck = true;
            }
        };

        [
            ['name.KYAKNM_SEI_KNJ', 'txtKyaknmSeiKnj', [nameSeiMeiKanjiChg, 0]],
            ['name.KYAKNM_MEI_KNJ', 'txtKyaknmMeiKnj', [nameSeiMeiKanjiChg, 1]],
            ['name.KYAKNM_SEI_KANA', 'txtKyaknmSeiKana'],
            ['name.KYAKNM_MEI_KANA', 'txtKyaknmMeiKana'],

            ['addr.TNKYY', 'txtTnkyYear'],
            ['addr.TNKYM', 'txtTnkyMonth'],
            ['addr.TNKYD', 'txtTnkyDay'],

            ['tels.TELNO1', 'txtTelno1'],
            ['tels.TELNO2', 'txtTelno2'],
            ['tels.TELNO3', 'txtTelno3'],

            ['tels.MOBILE_TELNO1', 'txtMobileTelno1'],
            ['tels.MOBILE_TELNO2', 'txtMobileTelno2'],
            ['tels.MOBILE_TELNO3', 'txtMobileTelno3'],

            ['tels.FAXNO1', 'txtFaxno1'],
            ['tels.FAXNO2', 'txtFaxno2'],
            ['tels.FAXNO3', 'txtFaxno3'],

        ].forEach(e => {
            $scope.$watch(e[0], function(newValue, oldValue){
                if (newValue === oldValue) return;
                if (newValue == undefined || newValue === '') {
                    clearErrorGroup(e[1]);
                    // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913
                    // 入力確定時相関チェック実施のため、入力チェック処理呼び出し
                    if (e[0] === 'tels.TELNO1' || e[0] === 'tels.TELNO2' || e[0] === 'tels.TELNO3') {
                        clearErrorGroup('txtTelno1-txtTelno2');
                        checkTel12Length();
                    }
                    if (e[0] === 'tels.FAXNO1' || e[0] === 'tels.FAXNO2' || e[0] === 'tels.FAXNO3') {
                        clearErrorGroup('txtFaxno1-txtFaxno2');
                        checkFax12Length();
                    }
                    // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913
                }
                if (angular.isArray(e[2]) && angular.isFunction(e[2][0])){
                    var funcAndParams :any = e[2];
                    funcAndParams[0].apply(null, funcAndParams.slice(1));
                }
            });
        });

        /**
         * 「変更する」ボタンに関するログ出力処理
         * @param {string} isInputShow 「変更する」、「変更取消」フラグ
         * @param {string} title タイトル名
         * @param {string} index インデックス
         *   
         */
        $scope.writeBtnLog = function(isInputShow, title, index = ''){
            var btnName = "変更する";
            '1' == isInputShow && (btnName="変更取消");
            logicCom.btnTapLog($scope.Const.PageID, $scope.Const.PageID,`${btnName}（${title + index}）`);
        }

        /**
         * 「ナビゲーション」ボタンに関するログ出力処理
         * @param {string} isShow 「ナビゲーション」、「閉じる」フラグ
         *   
         */
        $scope.writeNavLog = function(isShow){
            if(isShow){
                logicCom.btnTapLog('G1080-01', 'G1080-02', 'ナビゲーション');
            } else {
                logicCom.btnTapLog('G1080-02', 'G1080-01', '閉じる');
            }
        }

        /**
         * 「ナビゲーション」ボタンに関するログ出力処理
         * @param {string} navName 選択したタイトル名  
         *   
         */
        $scope.writeNavItemLog = function(navName){
            logicCom.btnTapLog('G1080-02', 'G1080-02', navName);
        }

        // ------------------------------------ ここからスコープ処理メッソド END ------------------------------------ //

        
        // ここからは「G1080-24：事務手続きのエラー項目表示画面」の処理

        /**
         * 「閉じる」ボタンタップ
         */
        $scope.closeErrItemModal = function(){
            // ２重クリックを防止
            if (isBtnClickedFlg) {
                return;
            } else {
                isBtnClickedFlg = true;
            }
            scrollUnlock();
            // アクションログ出力
            logicCom.btnTapLog($scope.Const.errPageID, $scope.Const.PageID, '閉じる');
            isBtnClickedFlg = false;
        }

        // ここからは「G1080-23：申込中止画面」の処理

        /**
         * 「いいえ」ボタンタップ
         */
        $scope.stopBtnNoClick = function(){
            // ２重クリックを防止
            if (isBtnClickedFlg) {
                return;
            } else {
                isBtnClickedFlg = true;
            }
            scrollUnlock();
            // アクションログ出力
            logicCom.btnTapLog($scope.Const.stopConfrimPageID, $scope.Const.PageID, 'いいえ');
            isBtnClickedFlg = false;
        }

        /**
         * 「はい」ボタンタップ
         */
        $scope.stopBtnYesClick = function(){

            // ２重クリックを防止
            if (isBtnClickedFlg) {
                return;
            } else {
                isBtnClickedFlg = true;
            }
            scrollUnlock();

            var successCallBack = function () {
                // データをクリア
                AppBizCom.DataHolder.setNotifInfo({});      // 申込データ
                AppBizCom.DataHolder.setImageData({});      // 画像データ
                AppBizCom.DataHolder.setCustomer({});       // 顧客基本情報
                // 01-2022-06-224 本人確認書類撮影画面のガード対応 開始 20221031
                AppBizCom.DataHolder.setOcrData({});        // OCR結果データ
                // 01-2022-06-224 本人確認書類撮影画面のガード対応 終了 20221031
                AppBizCom.DataHolder.setFlowControlFlg({}); // 制御用フラグ
                AppBizCom.DataHolder.clearRouteInfo();      // 画面遷移ルーティング情報
                AppBizCom.DataHolder.setLocation({});       // 位置情報

            };

            //「G1040-01：ホームメニュー画面」に遷移する
            logicCom.locationPath('homeMenu', successCallBack, emptyCallback, connectionErrorCallback);

            // アクションログ出力
            logicCom.btnTapLog($scope.Const.PageID, $scope.Const.homePageID, 'はい');
        }
        
        // 画面廃棄時、リスナーも廃棄する
        $scope.$on('$destroy', function () {
            $("#errItemModal").off("show.bs.modal");
            $("#errItemModal").off("hidden.bs.modal");
            $("#G1080-23").off("show.bs.modal");
            $("#G1080-23").off("hidden.bs.modal");

            // ぼかしの背景を消すため、bodyにクラスを削除
            $('body').removeClass('is-modal-open');
        });

        // 画面初期化
        init();

    }]);

// 郵便番号用
App.filter('substr', function () {
    return function (val, from, to) {
        if (!val) return val;
        if (typeof val != 'string') return val;
        return val.slice(from, to);
    }
});