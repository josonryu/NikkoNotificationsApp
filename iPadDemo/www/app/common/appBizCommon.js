/// <reference path="../reference.d.ts" />
App
    .factory('AppBizCom', ['AppBizInputAssistant', 'AppBizNumKeyboard', 'AppBizAddSearch', 'AppBizBankSearch', 'AppBizMeigaraSearch', 'AppBizCountrySearch', 'AppBizMsg', 'AppBizCamera', 'AppBizCheckServTime', 'AppBizEmojiUtil', 'AppBizDataHolder', 'AppBizCodeMstData', 'AppBizInputCheck',
    function (AppBizInputAssistant, AppBizNumKeyboard, AppBizAddSearch, AppBizBankSearch, AppBizMeigaraSearch, AppBizCountrySearch, AppBizMsg, AppBizCamera, AppBizCheckServTime, AppBizEmojiUtil, AppBizDataHolder, AppBizCodeMstData, AppBizInputCheck) {
        return {
            InputAssistant: AppBizInputAssistant,
            NumKeyboard: AppBizNumKeyboard,
            AddSearch: AppBizAddSearch,
            BankSearch: AppBizBankSearch,
            MeigaraSearch: AppBizMeigaraSearch,
            CountrySearch: AppBizCountrySearch,
            MstData: AppBizCodeMstData,
            InputCheck: AppBizInputCheck,
            Msg: AppBizMsg,
            Camera: AppBizCamera,
            CheckServTime: AppBizCheckServTime,
            EmojiUtil: AppBizEmojiUtil,
            DataHolder: AppBizDataHolder,
        };
    }])
    .factory('AppBizInputAssistant', ['AppComLog', 'AppBizEmojiUtil', 'AppComDevice', function (AppComLog, AppBizEmojiUtil, AppComDevice) {
        var handwritePanel;
        return {
            /**
             * 手書き入力部品Classの初期化
             */
            handwritePanelClassInit: function () {
                var tmpOsVer = AppComDevice.getIosVer().split('.');
                if (tmpOsVer[0] < 13) {
                    handwritePanel = new HandWritePanel(AppBizEmojiUtil);
                }
                else {
                    handwritePanel = new HandWritePanelNew(AppBizEmojiUtil);
                }
            },
            /**
             * 手書き入力部品の初期化 ※初期化前に、必ず「handwritePanelClassInit」を実施する（一回のみ）
             *
             * @param {array} targetsDef - 対象項目定義
             * @param {string} userId - 社員ID
             * @param {string} miseiCode - 受付者店部課コード
             * @param {string} kakariCode - 受付者係コード
             * @param {string} screenId - 画面ID
             */
            init: function (targetsDef, userId, miseiCode, kakariCode, screenId) {
                var logObj = {
                    'userId': userId,
                    'miseiCode': miseiCode,
                    'kakariCode': kakariCode,
                    'screenId': screenId,
                    'AppComLog': AppComLog
                };
                handwritePanel.init(targetsDef, logObj);
            },
            /**
             * 手書き入力部品の廃棄(保存した画面ID情報をクリア)
             *
             * @param {array} id - 対象項目ID
             */
            deinit: function (id) {
                handwritePanel.deinit(id);
            }
        };
    }])
    .factory('AppBizNumKeyboard', [function () {
        var keyboard;
        return {
            /**
             * 数値キーボード部品Classの初期化
             */
            keyboardClassInit: function () {
                keyboard = new NumKeyboard();
            },
            /**
             * 数値キーボード部品の初期化 ※初期化前に、必ず「keyboardClassInit」を実施する（一回のみ）
             */
            init: function (targetsDef) {
                keyboard.init(targetsDef);
            }
        };
    }])
    .factory('AppBizAddSearch', ['AppComClientDb', function (AppComClientDb) {
        /**
         * 郵便番号逆検索の内部共通部品
         *
         * @param {any} db - DB接続
         * @param {string} address - 住所
         * @param {string} addressNo - 住所(都道府県なし)
         * @param {successCallback} successCallback - 成功時のコールバック関数
         * @param {errorCallback} errorCallback - 失敗時のコールバック関数
         */
        function zipcodeSearchCom(db, address, addressNo, successCallback, errorCallback) {
            // KENSKYO_YUBINNO_MAE: 郵便番号上3桁
            // KENSKYO_YUBINNO_ATO: 郵便番号下4桁
            // TIIKI_C: 地域コード
            // TIIKI_C_ADDR: 地域コード住所
            // RECNO: RECNO
            // 郵便番号逆検索SQL文
            var zipcodeSql = "SELECT DISTINCT KENSKYO_YUBINNO_MAE, KENSKYO_YUBINNO_ATO FROM HST_JSYKNSK_MAST ";
            // 郵便番号検索SQLの条件文
            var zipSqlWhere = "WHERE KENSKYO_YUBINNO_MAE || KENSKYO_YUBINNO_ATO <> '0000000' AND (TIIKI_C_ADDR || HOSK_ADDR GLOB ? OR TIIKI_C_ADDR || HOSK_ADDR GLOB ?) ORDER BY ";
            // 郵便番号検索SQLのソート順
            var zipSqlCaseWhen = (function () {
                var rstStr = "";
                for (var i = 0, len = addressNo.length; i < len; i++) {
                    0 === i && (rstStr += "(CASE ");
                    rstStr += `WHEN TIIKI_C_ADDR || HOSK_ADDR GLOB '${address.slice(0, (len - i))}*' OR TIIKI_C_ADDR || HOSK_ADDR GLOB '${addressNo.slice(0, (len - i))}*' THEN ${i} `;
                }
                rstStr && (rstStr += `ELSE ${addressNo.length} END), `);
                return rstStr;
            }());
            var zipSqlOrderBy = "KENSKYO_YUBINNO_MAE, KENSKYO_YUBINNO_ATO LIMIT 0,1";
            // 郵便番号逆検索SQLのパラメータ
            var zipcodeSqlParam = [];
            zipcodeSqlParam.push(address.slice(0, 1) + '*');
            zipcodeSqlParam.push(addressNo.slice(0, 1) + '*');
            // 郵便番号逆検索SQL文の組み立て
            zipcodeSql = zipcodeSql + zipSqlWhere + zipSqlCaseWhen + zipSqlOrderBy;
            // 郵便番号逆検索成功時の内部コールバック関数
            var resultCallback = function (result) {
                // 検索結果の件数
                var recordLength = result.rows.length;
                // 戻り値の初期化
                var rtnResult = { length: 0, zipcodeUp: '', zipcodeDown: '' };
                if (recordLength > 0) {
                    rtnResult.zipcodeUp = result.rows.item(0).KENSKYO_YUBINNO_MAE;
                    rtnResult.zipcodeDown = result.rows.item(0).KENSKYO_YUBINNO_ATO;
                }
                successCallback(rtnResult);
            };
            // 郵便番号逆検索SQL文実行
            AppComClientDb.execSQL(db, zipcodeSql, zipcodeSqlParam, resultCallback, errorCallback);
        }
        ;
        return {
            /**
             * 郵便番号より住所を検索する
             *
             * @param {string} zipCodeUp - 郵便番号上3桁
             * @param {string} zipCodeDown - 郵便番号下4桁
             * @param {successCallback} successCallback - 成功時のコールバック関数
             * @param {errorCallback} errorCallback - 失敗時のコールバック関数
             */
            searchFromZip: function (zipCodeUp, zipCodeDown, successCallback, errorCallback) {
                // KENSKYO_YUBINNO_MAE: 郵便番号上3桁
                // KENSKYO_YUBINNO_ATO: 郵便番号下4桁
                // TIIKI_C: 地域コード
                // TIIKI_C_ADDR: 地域コード住所
                // TIIKI_C_ADDR_KANA: 地域コード住所カナ
                // RECNO: RECNO
                // 郵便番号検索SQL文
                var zipSql = "SELECT KENSKYO_YUBINNO_MAE, KENSKYO_YUBINNO_ATO, MIN(TIIKI_C) AS TIIKI_C, TIIKI_C_ADDR, TIIKI_C_ADDR_KANA FROM HST_JSYKNSK_MAST ";
                // 郵便番号検索SQLの条件文
                var zipSqlWhere = "WHERE KENSKYO_YUBINNO_MAE || KENSKYO_YUBINNO_ATO <> '0000000' AND ";
                // 郵便番号検索SQLのグループ順
                var zipSqlGroupBy = "GROUP BY KENSKYO_YUBINNO_MAE, KENSKYO_YUBINNO_ATO, TIIKI_C_ADDR ";
                // 郵便番号検索SQLのソート順
                var zipSqlOrderBy = "ORDER BY KENSKYO_YUBINNO_MAE, KENSKYO_YUBINNO_ATO, RECNO";
                // 郵便番号検索SQLのパラメータ
                var zipSqlParam = [];
                var countFlg = false;
                // 郵便番号下4桁が""(ブランク)である場合
                if (!zipCodeDown) {
                    zipSqlWhere = zipSqlWhere + "KENSKYO_YUBINNO_MAE = ? ";
                    zipSqlParam.push(zipCodeUp);
                    countFlg = true;
                }
                else {
                    zipSqlWhere = zipSqlWhere + "KENSKYO_YUBINNO_MAE = ? AND KENSKYO_YUBINNO_ATO = ? ";
                    zipSqlParam.push(zipCodeUp);
                    zipSqlParam.push(zipCodeDown);
                }
                // 郵便番号検索SQL文の組み立て
                zipSql = zipSql + zipSqlWhere + zipSqlGroupBy + zipSqlOrderBy;
                // DB開く
                var db = AppComClientDb.open();
                // 追加仕様：上3桁検索する前に、件数を検索する（100件以上の場合、中身検索不要）
                if (countFlg) {
                    var zipCountSql = "SELECT COUNT(*) FROM HST_JSYKNSK_MAST ";
                    zipCountSql = zipCountSql + zipSqlWhere + zipSqlGroupBy;
                    var countSuccessCallback = function (result) {
                        var recordLth = result.rows.length;
                        if (recordLth > 100 && !zipCodeDown) {
                            var tmpResult = {};
                            tmpResult['errFlag'] = true;
                            tmpResult['recordLth'] = recordLth;
                            successCallback(tmpResult);
                        }
                        else {
                            // 郵便番号検索SQL文実行
                            AppComClientDb.execSQL(db, zipSql, zipSqlParam, successCallback, errorCallback);
                        }
                    };
                    // 郵便番号検索件数SQL文実行
                    AppComClientDb.execSQL(db, zipCountSql, zipSqlParam, countSuccessCallback, errorCallback);
                }
                else {
                    // 郵便番号検索SQL文実行
                    AppComClientDb.execSQL(db, zipSql, zipSqlParam, successCallback, errorCallback);
                }
            },
            /**
             * 住所より郵便番号を逆検索する
             *
             * @param {string} address - 住所
             * @param {successCallback} successCallback - 成功時のコールバック関数
             * @param {errorCallback} errorCallback - 失敗時のコールバック関数
             */
            searchFromAdd: function (address, successCallback, errorCallback) {
                // 住所(都道府県なし)
                var addressNo = address;
                var regExpStr = /^.{2,3}?[都道府県](.+)/;
                var matchRes = address.match(regExpStr);
                if (matchRes) {
                    if (matchRes[1]) {
                        addressNo = matchRes[1];
                    }
                }
                // DB接続
                var db = AppComClientDb.open();
                zipcodeSearchCom(db, address, addressNo, successCallback, errorCallback);
            }
        };
    }])
    .factory('AppBizBankSearch', ['AppComClientDb', 'AppComStringUtil', function (AppComClientDb, AppComStringUtil) {
        return {
            /**
             * 金融機関名称より金融機関コードを検索する。
             *
             * @param {string} bankName - 金融機関名称
             * @param {successCallback} successCallback - 成功時のコールバック関数
             * @param {errorCallback} errorCallback - 失敗時のコールバック関数
             */
            searchFromBkNm: function (bankName, successCallback, errorCallback) {
                // BK_C: 金融機関コード
                // BK_FORMNM_KNJ: 金融機関正式名（漢字
                // BK_FORMNM_KANA: 金融機関正式名（カナ
                // 金融機関名称検索SQL文
                var bankSql = "SELECT DISTINCT BK_C, BK_FORMNM_KNJ FROM KINY_INSTTT_MAST WHERE BK_FORMNM_KNJ LIKE ? OR BK_FORMNM_KANA LIKE ? ORDER BY BK_C";
                // 金融機関名称検索SQLのパラメータ
                var bankSqlParam = [];
                // 金融機関名称の桁数が1である場合
                if (bankName.length == 1) {
                    // 前方一致検索を行う
                    bankSqlParam.push(bankName + '%');
                    bankSqlParam.push(AppComStringUtil.smallToLarge(bankName) + '%');
                }
                else if (bankName.length > 1) {
                    // 部分一致検索を行う
                    bankSqlParam.push('%' + bankName + '%');
                    bankSqlParam.push('%' + AppComStringUtil.smallToLarge(bankName) + '%');
                }
                // DB開く
                var db = AppComClientDb.open();
                // 金融機関名称検索SQL文実行
                AppComClientDb.execSQL(db, bankSql, bankSqlParam, successCallback, errorCallback);
            },
            /**
             * 金融機関コードと支店名より金融機関情報を検索する。
             *
             * @param {string} bankCode - 金融機関コード
             * @param {string} bankName - 金融機関名称
             * @param {string} subBankName - 支店名
             * @param {successCallback} successCallback - 成功時のコールバック関数
             * @param {errorCallback} errorCallback - 失敗時のコールバック関数
             */
            searchFromBkCd: function (bankCode, bankName, subBankName, successCallback, errorCallback) {
                // BK_MISE_C: 金融機関支店コード
                // BK_MISE_FORMNM_KNJ: 金融機関支店正式名（漢字
                // BK_MISE_FORMNM_KANA: 金融機関支店正式名（カナ
                // BK_C: 金融機関コード
                // BK_FORMNM_KNJ: 金融機関正式名（漢字
                // 金融機関支店情報検索SQL文
                var subBankSql = "SELECT BK_MISE_C, BK_MISE_FORMNM_KNJ FROM KINY_INSTTT_MAST WHERE BK_C = ? AND BK_FORMNM_KNJ = ? AND (BK_MISE_FORMNM_KNJ LIKE ? OR BK_MISE_FORMNM_KANA LIKE ?) ORDER BY BK_MISE_C";
                // 金融機関支店情報検索SQLのパラメータ
                var subBankSqlParam = [];
                // 金融機関コードをパラメータに追加する
                subBankSqlParam.push(bankCode);
                // 金融機関名称をパラメータに追加する
                subBankSqlParam.push(bankName);
                // 支店名の桁数が1である場合
                if (subBankName.length == 1) {
                    // 前方一致検索を行う
                    subBankSqlParam.push(subBankName + '%');
                    subBankSqlParam.push(AppComStringUtil.smallToLarge(subBankName) + '%');
                }
                else if (subBankName.length > 1) {
                    // 部分一致検索を行う
                    subBankSqlParam.push('%' + subBankName + '%');
                    subBankSqlParam.push('%' + AppComStringUtil.smallToLarge(subBankName) + '%');
                }
                // DB開く
                var db = AppComClientDb.open();
                // 金融機関支店情報検索SQL文実行
                AppComClientDb.execSQL(db, subBankSql, subBankSqlParam, successCallback, errorCallback);
            }
        };
    }])
    .factory('AppBizMeigaraSearch', ['AppComClientDb', 'AppComStringUtil', function (AppComClientDb, AppComStringUtil) {
        return {
            /**
             * 銘柄名称より銘柄コードを検索する。
             *
             * @param {string} meigaraName - 銘柄名称
             * @param {successCallback} successCallback - 成功時のコールバック関数
             * @param {errorCallback} errorCallback - 失敗時のコールバック関数
             */
            searchFromMeigaraNm: function (meigaraName, successCallback, errorCallback) {
                // MIGR_CD: 銘柄コード
                // MIGR_FORMNM_KNJ: 銘柄正式名（漢字
                // MIGR_FORMNM_KANA: 銘柄正式名（カナ
                // 銘柄名称検索SQL文
                var meigaraSql = "SELECT DISTINCT MIGR_CD, MIGR_FORMNM_KNJ FROM MEIG_MAST WHERE MIGR_FORMNM_KANA LIKE ? OR MIGR_FORMNM_KNJ LIKE ? ORDER BY MIGR_CD";
                // 銘柄名称検索SQLのパラメータ
                var meigaraSqlParam = [];
                // 銘柄名称の桁数が1である場合
                if (meigaraName.length == 1) {
                    // 前方一致検索を行う
                    meigaraSqlParam.push(AppComStringUtil.smallToLarge(meigaraName) + '%');
                    meigaraSqlParam.push(meigaraName + '%');
                }
                else if (meigaraName.length > 1) {
                    // 部分一致検索を行う
                    meigaraSqlParam.push('%' + AppComStringUtil.smallToLarge(meigaraName) + '%');
                    meigaraSqlParam.push('%' + meigaraName + '%');
                }
                // DB開く
                var db = AppComClientDb.open();
                // 銘柄名称検索SQL文実行
                AppComClientDb.execSQL(db, meigaraSql, meigaraSqlParam, successCallback, errorCallback);
            }
        };
    }])
    .factory('AppBizCountrySearch', ['AppComClientDb', function (AppComClientDb) {
        return {
            /**
             * 全ての国籍名称を検索する（リスト返却）。
             *
             * @param {successCallback} successCallback - 成功時のコールバック関数
             * @param {errorCallback} errorCallback - 失敗時のコールバック関数
             */
            searchCountry: function (successCallback, errorCallback) {
                // KOKSEK_C: 国籍コード
                // KOKSEKNM_KANA: 国籍名（カナ
                // KOKSEKNM_ENG: 国籍名（英字
                // 国籍名称検索SQL文
                var countrySql = "SELECT DISTINCT KOKSEK_C, KOKSEKNM_KANA FROM BOJ_KUNI_MAST ORDER BY KOKSEKNM_ENG";
                // 国籍名称検索SQLのパラメータ
                var countrySqlParam = [];
                // DB開く
                var db = AppComClientDb.open();
                // 国籍名称検索SQL文実行
                AppComClientDb.execSQL(db, countrySql, countrySqlParam, successCallback, errorCallback);
            }
        };
    }])
    .factory('AppBizCodeMstData', ['AppComClientDb', 'AppBizDataHolder', 'appDefine',
    function (AppComClientDb, AppBizDataHolder, appDefine) {
        return {
            /**
             * アプリDB「コードマスター」から全てのマスタ情報を取得し、業務共通領域「マスタ情報」にセットする。
             *
             * @param {successCallback} successCallback - 成功時のコールバック関数
             * @param {errorCallback} errorCallback - 失敗時のコールバック関数
             */
            setCodeMstData: function (successCallback, errorCallback) {
                // 業務共通領域「マスタ情報」をクリアする
                AppBizDataHolder.setCodeMaster({});
                // コードマスター検索SQL文
                var codeMstSql = "SELECT TRIM(KBN) AS KBN, CD, MSY, STM1, STM2, STM3, STM4, STM5, STM6, SORT_KEY FROM CD_MAST_JIMU WHERE DEL_FLG IS NOT '1' ORDER BY KBN, SORT_KEY, CD";
                // DB開く
                var db = AppComClientDb.open();
                // コードマスター検索SQL文実行
                AppComClientDb.execSQL(db, codeMstSql, [], function (result) {
                    // マスタ情報宣言
                    var codeMstData = {};
                    for (var i = 0; i < result.rows.length; i++) {
                        var codeMstItem = {};
                        var rowItem = result.rows.item(i);
                        codeMstItem[appDefine.masterJoho.KBN] = rowItem.KBN;
                        codeMstItem[appDefine.masterJoho.CD] = rowItem.CD;
                        codeMstItem[appDefine.masterJoho.MSY] = rowItem.MSY;
                        codeMstItem[appDefine.masterJoho.STM1] = rowItem.STM1;
                        codeMstItem[appDefine.masterJoho.STM2] = rowItem.STM2;
                        codeMstItem[appDefine.masterJoho.STM3] = rowItem.STM3;
                        codeMstItem[appDefine.masterJoho.STM4] = rowItem.STM4;
                        codeMstItem[appDefine.masterJoho.STM5] = rowItem.STM5;
                        codeMstItem[appDefine.masterJoho.STM6] = rowItem.STM6;
                        codeMstItem[appDefine.masterJoho.SORT_KEY] = rowItem.SORT_KEY;
                        if (codeMstData[rowItem.KBN]) {
                            codeMstData[rowItem.KBN].push(codeMstItem);
                        }
                        else {
                            codeMstData[rowItem.KBN] = [codeMstItem];
                        }
                    }
                    // 業務共通領域「マスタ情報」をセットする
                    AppBizDataHolder.setCodeMaster(codeMstData);
                    // 成功時のコールバック関数を呼び出す
                    successCallback();
                }, errorCallback);
            },
            /**
             * 指定した区分に対するマスタ情報を取得する。
             *
             * @param {string} searchKbn - 区分
             * @return {Array} マスタ情報取得結果--取得結果がない場合、[]をリターンする
             */
            getCodeMstDataByKbn: function (searchKbn) {
                // 業務共通領域からマスタ情報を取得する
                var codeMstData = AppBizDataHolder.getCodeMaster();
                if (codeMstData.hasOwnProperty(searchKbn)) {
                    // 取得したマスタ情報
                    return codeMstData[searchKbn];
                }
                return [];
            },
            /**
             * 指定したコード、区分に対するマスタ情報を取得する。
             *
             * @param {string} searchKbn - 区分
             * @param {string} searchCd - コード
             * @return {any} マスタ情報取得結果--取得結果がない場合、undefinedをリターンする
             */
            getCodeMstDataByCd: function (searchKbn, searchCd) {
                // 業務共通領域からマスタ情報を取得する
                var codeMstItemList = this.getCodeMstDataByKbn(searchKbn);
                for (var i = 0; i < codeMstItemList.length; i++) {
                    if (searchCd == codeMstItemList[i][appDefine.masterJoho.CD]) {
                        // 取得したマスタ情報
                        return codeMstItemList[i];
                    }
                }
                return undefined;
            }
        };
    }])
    .service('AppBizInputCheck', ['AppBizEmojiUtil', 'AppComDate', function (AppBizEmojiUtil, AppComDate) {
        var kajiJis1Str = "亜唖娃阿哀愛挨姶逢葵茜穐悪握渥旭葦芦鯵梓圧斡扱宛姐虻飴絢綾鮎或粟袷安庵按暗案闇鞍杏以伊位依偉囲夷委威尉惟意慰易椅為畏異移維緯胃萎衣謂違遺医井亥域育郁磯一壱溢逸稲茨芋鰯允印咽員因姻引飲淫胤蔭院陰隠韻吋右宇烏羽迂雨卯鵜窺丑碓臼渦嘘唄欝蔚鰻姥厩浦瓜閏噂云運雲荏餌叡営嬰影映曳栄永泳洩瑛盈穎頴英衛詠鋭液疫益駅悦謁越閲榎厭円園堰奄宴延怨掩援沿演炎焔煙燕猿縁艶苑薗遠鉛鴛塩於汚甥凹央奥往応押旺横欧殴王翁襖鴬鴎黄岡沖荻億屋憶臆桶牡乙俺卸恩温穏音下化仮何伽価佳加可嘉夏嫁家寡科暇果架歌河火珂禍禾稼箇花苛茄荷華菓蝦課嘩貨迦過霞蚊俄峨我牙画臥芽蛾賀雅餓駕介会解回塊壊廻快怪悔恢懐戒拐改魁晦械海灰界皆絵芥蟹開階貝凱劾外咳害崖慨概涯碍蓋街該鎧骸浬馨蛙垣柿蛎鈎劃嚇各廓拡撹格核殻獲確穫覚角赫較郭閣隔革学岳楽額顎掛笠樫橿梶鰍潟割喝恰括活渇滑葛褐轄且鰹叶椛樺鞄株兜竃蒲釜鎌噛鴨栢茅萱粥刈苅瓦乾侃冠寒刊勘勧巻喚堪姦完官寛干幹患感慣憾換敢柑桓棺款歓汗漢澗潅環甘監看竿管簡緩缶翰肝艦莞観諌貫還鑑間閑関陥韓館舘丸含岸巌玩癌眼岩翫贋雁頑顔願企伎危喜器基奇嬉寄岐希幾忌揮机旗既期棋棄機帰毅気汽畿祈季稀紀徽規記貴起軌輝飢騎鬼亀偽儀妓宜戯技擬欺犠疑祇義蟻誼議掬菊鞠吉吃喫桔橘詰砧杵黍却客脚虐逆丘久仇休及吸宮弓急救朽求汲泣灸球究窮笈級糾給旧牛去居巨拒拠挙渠虚許距鋸漁禦魚亨享京供侠僑兇競共凶協匡卿叫喬境峡強彊怯恐恭挟教橋況狂狭矯胸脅興蕎郷鏡響饗驚仰凝尭暁業局曲極玉桐粁僅勤均巾錦斤欣欽琴禁禽筋緊芹菌衿襟謹近金吟銀九倶句区狗玖矩苦躯駆駈駒具愚虞喰空偶寓遇隅串櫛釧屑屈掘窟沓靴轡窪熊隈粂栗繰桑鍬勲君薫訓群軍郡卦袈祁係傾刑兄啓圭珪型契形径恵慶慧憩掲携敬景桂渓畦稽系経継繋罫茎荊蛍計詣警軽頚鶏芸迎鯨劇戟撃激隙桁傑欠決潔穴結血訣月件倹倦健兼券剣喧圏堅嫌建憲懸拳捲検権牽犬献研硯絹県肩見謙賢軒遣鍵険顕験鹸元原厳幻弦減源玄現絃舷言諺限乎個古呼固姑孤己庫弧戸故枯湖狐糊袴股胡菰虎誇跨鈷雇顧鼓五互伍午呉吾娯後御悟梧檎瑚碁語誤護醐乞鯉交佼侯候倖光公功効勾厚口向后喉坑垢好孔孝宏工巧巷幸広庚康弘恒慌抗拘控攻昂晃更杭校梗構江洪浩港溝甲皇硬稿糠紅紘絞綱耕考肯肱腔膏航荒行衡講貢購郊酵鉱砿鋼閤降項香高鴻剛劫号合壕拷濠豪轟麹克刻告国穀酷鵠黒獄漉腰甑忽惚骨狛込此頃今困坤墾婚恨懇昏昆根梱混痕紺艮魂些佐叉唆嵯左差査沙瑳砂詐鎖裟坐座挫債催再最哉塞妻宰彩才採栽歳済災采犀砕砦祭斎細菜裁載際剤在材罪財冴坂阪堺榊肴咲崎埼碕鷺作削咋搾昨朔柵窄策索錯桜鮭笹匙冊刷察拶撮擦札殺薩雑皐鯖捌錆鮫皿晒三傘参山惨撒散桟燦珊産算纂蚕讃賛酸餐斬暫残仕仔伺使刺司史嗣四士始姉姿子屍市師志思指支孜斯施旨枝止死氏獅祉私糸紙紫肢脂至視詞詩試誌諮資賜雌飼歯事似侍児字寺慈持時次滋治爾璽痔磁示而耳自蒔辞汐鹿式識鴫竺軸宍雫七叱執失嫉室悉湿漆疾質実蔀篠偲柴芝屡蕊縞舎写射捨赦斜煮社紗者謝車遮蛇邪借勺尺杓灼爵酌釈錫若寂弱惹主取守手朱殊狩珠種腫趣酒首儒受呪寿授樹綬需囚収周宗就州修愁拾洲秀秋終繍習臭舟蒐衆襲讐蹴輯週酋酬集醜什住充十従戎柔汁渋獣縦重銃叔夙宿淑祝縮粛塾熟出術述俊峻春瞬竣舜駿准循旬楯殉淳準潤盾純巡遵醇順処初所暑曙渚庶緒署書薯藷諸助叙女序徐恕鋤除傷償勝匠升召哨商唱嘗奨妾娼宵将小少尚庄床廠彰承抄招掌捷昇昌昭晶松梢樟樵沼消渉湘焼焦照症省硝礁祥称章笑粧紹肖菖蒋蕉衝裳訟証詔詳象賞醤鉦鍾鐘障鞘上丈丞乗冗剰城場壌嬢常情擾条杖浄状畳穣蒸譲醸錠嘱埴飾拭植殖燭織職色触食蝕辱尻伸信侵唇娠寝審心慎振新晋森榛浸深申疹真神秦紳臣芯薪親診身辛進針震人仁刃塵壬尋甚尽腎訊迅陣靭笥諏須酢図厨逗吹垂帥推水炊睡粋翠衰遂酔錐錘随瑞髄崇嵩数枢趨雛据杉椙菅頗雀裾澄摺寸世瀬畝是凄制勢姓征性成政整星晴棲栖正清牲生盛精聖声製西誠誓請逝醒青静斉税脆隻席惜戚斥昔析石積籍績脊責赤跡蹟碩切拙接摂折設窃節説雪絶舌蝉仙先千占宣専尖川戦扇撰栓栴泉浅洗染潜煎煽旋穿箭線繊羨腺舛船薦詮賎践選遷銭銑閃鮮前善漸然全禅繕膳糎噌塑岨措曾曽楚狙疏疎礎祖租粗素組蘇訴阻遡鼠僧創双叢倉喪壮奏爽宋層匝惣想捜掃挿掻操早曹巣槍槽漕燥争痩相窓糟総綜聡草荘葬蒼藻装走送遭鎗霜騒像増憎臓蔵贈造促側則即息捉束測足速俗属賊族続卒袖其揃存孫尊損村遜他多太汰詑唾堕妥惰打柁舵楕陀駄騨体堆対耐岱帯待怠態戴替泰滞胎腿苔袋貸退逮隊黛鯛代台大第醍題鷹滝瀧卓啄宅托択拓沢濯琢託鐸濁諾茸凧蛸只叩但達辰奪脱巽竪辿棚谷狸鱈樽誰丹単嘆坦担探旦歎淡湛炭短端箪綻耽胆蛋誕鍛団壇弾断暖檀段男談値知地弛恥智池痴稚置致蜘遅馳築畜竹筑蓄逐秩窒茶嫡着中仲宙忠抽昼柱注虫衷註酎鋳駐樗瀦猪苧著貯丁兆凋喋寵帖帳庁弔張彫徴懲挑暢朝潮牒町眺聴脹腸蝶調諜超跳銚長頂鳥勅捗直朕沈珍賃鎮陳津墜椎槌追鎚痛通塚栂掴槻佃漬柘辻蔦綴鍔椿潰坪壷嬬紬爪吊釣鶴亭低停偵剃貞呈堤定帝底庭廷弟悌抵挺提梯汀碇禎程締艇訂諦蹄逓邸鄭釘鼎泥摘擢敵滴的笛適鏑溺哲徹撤轍迭鉄典填天展店添纏甜貼転顛点伝殿澱田電兎吐堵塗妬屠徒斗杜渡登菟賭途都鍍砥砺努度土奴怒倒党冬凍刀唐塔塘套宕島嶋悼投搭東桃梼棟盗淘湯涛灯燈当痘祷等答筒糖統到董蕩藤討謄豆踏逃透鐙陶頭騰闘働動同堂導憧撞洞瞳童胴萄道銅峠鴇匿得徳涜特督禿篤毒独読栃橡凸突椴届鳶苫寅酉瀞噸屯惇敦沌豚遁頓呑曇鈍奈那内乍凪薙謎灘捺鍋楢馴縄畷南楠軟難汝二尼弐迩匂賑肉虹廿日乳入如尿韮任妊忍認濡禰祢寧葱猫熱年念捻撚燃粘乃廼之埜嚢悩濃納能脳膿農覗蚤巴把播覇杷波派琶破婆罵芭馬俳廃拝排敗杯盃牌背肺輩配倍培媒梅楳煤狽買売賠陪這蝿秤矧萩伯剥博拍柏泊白箔粕舶薄迫曝漠爆縛莫駁麦函箱硲箸肇筈櫨幡肌畑畠八鉢溌発醗髪伐罰抜筏閥鳩噺塙蛤隼伴判半反叛帆搬斑板氾汎版犯班畔繁般藩販範釆煩頒飯挽晩番盤磐蕃蛮匪卑否妃庇彼悲扉批披斐比泌疲皮碑秘緋罷肥被誹費避非飛樋簸備尾微枇毘琵眉美鼻柊稗匹疋髭彦膝菱肘弼必畢筆逼桧姫媛紐百謬俵彪標氷漂瓢票表評豹廟描病秒苗錨鋲蒜蛭鰭品彬斌浜瀕貧賓頻敏瓶不付埠夫婦富冨布府怖扶敷斧普浮父符腐膚芙譜負賦赴阜附侮撫武舞葡蕪部封楓風葺蕗伏副復幅服福腹複覆淵弗払沸仏物鮒分吻噴墳憤扮焚奮粉糞紛雰文聞丙併兵塀幣平弊柄並蔽閉陛米頁僻壁癖碧別瞥蔑箆偏変片篇編辺返遍便勉娩弁鞭保舗鋪圃捕歩甫補輔穂募墓慕戊暮母簿菩倣俸包呆報奉宝峰峯崩庖抱捧放方朋法泡烹砲縫胞芳萌蓬蜂褒訪豊邦鋒飽鳳鵬乏亡傍剖坊妨帽忘忙房暴望某棒冒紡肪膨謀貌貿鉾防吠頬北僕卜墨撲朴牧睦穆釦勃没殆堀幌奔本翻凡盆摩磨魔麻埋妹昧枚毎哩槙幕膜枕鮪柾鱒桝亦俣又抹末沫迄侭繭麿万慢満漫蔓味未魅巳箕岬密蜜湊蓑稔脈妙粍民眠務夢無牟矛霧鵡椋婿娘冥名命明盟迷銘鳴姪牝滅免棉綿緬面麺摸模茂妄孟毛猛盲網耗蒙儲木黙目杢勿餅尤戻籾貰問悶紋門匁也冶夜爺耶野弥矢厄役約薬訳躍靖柳薮鑓愉愈油癒諭輸唯佑優勇友宥幽悠憂揖有柚湧涌猶猷由祐裕誘遊邑郵雄融夕予余与誉輿預傭幼妖容庸揚揺擁曜楊様洋溶熔用窯羊耀葉蓉要謡踊遥陽養慾抑欲沃浴翌翼淀羅螺裸来莱頼雷洛絡落酪乱卵嵐欄濫藍蘭覧利吏履李梨理璃痢裏裡里離陸律率立葎掠略劉流溜琉留硫粒隆竜龍侶慮旅虜了亮僚両凌寮料梁涼猟療瞭稜糧良諒遼量陵領力緑倫厘林淋燐琳臨輪隣鱗麟瑠塁涙累類令伶例冷励嶺怜玲礼苓鈴隷零霊麗齢暦歴列劣烈裂廉恋憐漣煉簾練聯蓮連錬呂魯櫓炉賂路露労婁廊弄朗楼榔浪漏牢狼篭老聾蝋郎六麓禄肋録論倭和話歪賄脇惑枠鷲亙亘鰐詫藁蕨椀湾碗腕";
        var fullEjiStr = "ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ";
        var fullKatakanaStr = "ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヰヱヲンヴヵヶ";
        var fullKajiBmStr = "纊褜鍈銈蓜俉炻昱棈鋹曻彅仡仼伀伃伹佖侒侊侚侔俍偀倢俿倞偆偰偂傔僴僘兊兤冝冾凬刕劜劦勀勛匀匇匤卲厓厲叝﨎咜咊咩哿喆坙坥垬埈埇﨏塚增墲夋奓奛奝奣妤妺孖寀甯寘寬尞岦岺峵崧嵓﨑嵂嵭嶸嶹巐弡弴彧德忞恝悅悊惞惕愠惲愑愷愰憘戓抦揵摠撝擎敎昀昕昻昉昮昞昤晥晗晙晴晳暙暠暲暿曺朎朗杦枻桒柀栁桄棏﨓楨﨔榘槢樰橫橆橳橾櫢櫤毖氿汜沆汯泚洄涇浯涖涬淏淸淲淼渹湜渧渼溿澈澵濵瀅瀇瀨炅炫焏焄煜煆煇凞燁燾犱犾猤猪獷玽珉珖珣珒琇珵琦琪琩琮瑢璉璟甁畯皂皜皞皛皦益睆劯砡硎硤硺礰礼神祥禔福禛竑竧靖竫箞精絈絜綷綠緖繒罇羡羽茁荢荿菇菶葈蒴蕓蕙蕫﨟薰蘒﨡蠇裵訒訷詹誧誾諟諸諶譓譿賰賴贒赶﨣軏﨤逸遧郞都鄕鄧釚釗釞釭釮釤釥鈆鈐鈊鈺鉀鈼鉎鉙鉑鈹鉧銧鉷鉸鋧鋗鋙鋐﨧鋕鋠鋓錥錡鋻﨨錞鋿錝錂鍰鍗鎤鏆鏞鏸鐱鑅鑈閒隆﨩隝隯霳霻靃靍靏靑靕顗顥飯飼餧館馞驎髙髜魵魲鮏鮱鮻鰀鵰鵫鶴鸙黑";
        var fullKigoStr = "、。，．・：；？！゛゜´｀¨＾￣＿ヽヾゝゞ〃仝々〆〇ー‐／＼～∥…‥‘’“”（）〔〕［］｛｝〈〉《》「」『』【】＋－±×÷＝≠＜＞≦≧∞∴♂♀°′″℃￥＄￠￡％＃＆＊＠§☆★○●◎◇◆□■△▲▽▼※〒→←↑↓〓∈∋⊆⊇⊂⊃∪∩∧∨￢⇒⇔∀∃∠⊥⌒∂∇≡≒≪≫√∽∝∵∫∬Å‰♯♭♪†‡¶◯ΑΒΓΔΕΖΗΘΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψωАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэ";
        var fullKigoIbmStr = "ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ№℡㈱ⅰⅱⅲⅳⅴⅵⅶⅷⅸⅹ＇＂";
        var fullSujiStr = "０１２３４５６７８９";
        var halfEjiStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        var halfKigoStr = "!#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
        var halfSujiStr = "0123456789";
        var hirakanaStr = "ぁあぃいぅうぇえぉおかがきぎくぐけげこごさざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろゎわゐゑをん";
        var fullKajiJis2Str = "弌丐丕个丱丶丼丿乂乖乘亂亅豫亊舒弍于亞亟亠亢亰亳亶从仍仄仆仂仗仞仭仟价伉佚估佛佝佗佇佶侈侏侘佻佩佰侑佯來侖儘俔俟俎俘俛俑俚俐俤俥倚倨倔倪倥倅伜俶倡倩倬俾俯們倆偃假會偕偐偈做偖偬偸傀傚傅傴傲僉僊傳僂僖僞僥僭僣僮價僵儉儁儂儖儕儔儚儡儺儷儼儻儿兀兒兌兔兢竸兩兪兮冀冂囘册冉冏冑冓冕冖冤冦冢冩冪冫决冱冲冰况冽凅凉凛几處凩凭凰凵凾刄刋刔刎刧刪刮刳刹剏剄剋剌剞剔剪剴剩剳剿剽劍劔劒剱劈劑辨辧劬劭劼劵勁勍勗勞勣勦飭勠勳勵勸勹匆匈甸匍匐匏匕匚匣匯匱匳匸區卆卅丗卉卍凖卞卩卮夘卻卷厂厖厠厦厥厮厰厶參簒雙叟曼燮叮叨叭叺吁吽呀听吭吼吮吶吩吝呎咏呵咎呟呱呷呰咒呻咀呶咄咐咆哇咢咸咥咬哄哈咨咫哂咤咾咼哘哥哦唏唔哽哮哭哺哢唹啀啣啌售啜啅啖啗唸唳啝喙喀咯喊喟啻啾喘喞單啼喃喩喇喨嗚嗅嗟嗄嗜嗤嗔嘔嗷嘖嗾嗽嘛嗹噎噐營嘴嘶嘲嘸噫噤嘯噬噪嚆嚀嚊嚠嚔嚏嚥嚮嚶嚴囂嚼囁囃囀囈囎囑囓囗囮囹圀囿圄圉圈國圍圓團圖嗇圜圦圷圸坎圻址坏坩埀垈坡坿垉垓垠垳垤垪垰埃埆埔埒埓堊埖埣堋堙堝塲堡塢塋塰毀塒堽塹墅墹墟墫墺壞墻墸墮壅壓壑壗壙壘壥壜壤壟壯壺壹壻壼壽夂夊夐夛梦夥夬夭夲夸夾竒奕奐奎奚奘奢奠奧奬奩奸妁妝佞侫妣妲姆姨姜妍姙姚娥娟娑娜娉娚婀婬婉娵娶婢婪媚媼媾嫋嫂媽嫣嫗嫦嫩嫖嫺嫻嬌嬋嬖嬲嫐嬪嬶嬾孃孅孀孑孕孚孛孥孩孰孳孵學斈孺宀它宦宸寃寇寉寔寐寤實寢寞寥寫寰寶寳尅將專對尓尠尢尨尸尹屁屆屎屓屐屏孱屬屮乢屶屹岌岑岔妛岫岻岶岼岷峅岾峇峙峩峽峺峭嶌峪崋崕崗嵜崟崛崑崔崢崚崙崘嵌嵒嵎嵋嵬嵳嵶嶇嶄嶂嶢嶝嶬嶮嶽嶐嶷嶼巉巍巓巒巖巛巫已巵帋帚帙帑帛帶帷幄幃幀幎幗幔幟幢幤幇幵并幺麼广庠廁廂廈廐廏廖廣廝廚廛廢廡廨廩廬廱廳廰廴廸廾弃弉彝彜弋弑弖弩弭弸彁彈彌彎弯彑彖彗彙彡彭彳彷徃徂彿徊很徑徇從徙徘徠徨徭徼忖忻忤忸忱忝悳忿怡恠怙怐怩怎怱怛怕怫怦怏怺恚恁恪恷恟恊恆恍恣恃恤恂恬恫恙悁悍惧悃悚悄悛悖悗悒悧悋惡悸惠惓悴忰悽惆悵惘慍愕愆惶惷愀惴惺愃愡惻惱愍愎慇愾愨愧慊愿愼愬愴愽慂慄慳慷慘慙慚慫慴慯慥慱慟慝慓慵憙憖憇憬憔憚憊憑憫憮懌懊應懷懈懃懆憺懋罹懍懦懣懶懺懴懿懽懼懾戀戈戉戍戌戔戛戞戡截戮戰戲戳扁扎扞扣扛扠扨扼抂抉找抒抓抖拔抃抔拗拑抻拏拿拆擔拈拜拌拊拂拇抛拉挌拮拱挧挂挈拯拵捐挾捍搜捏掖掎掀掫捶掣掏掉掟掵捫捩掾揩揀揆揣揉插揶揄搖搴搆搓搦搶攝搗搨搏摧摯摶摎攪撕撓撥撩撈撼據擒擅擇撻擘擂擱擧舉擠擡抬擣擯攬擶擴擲擺攀擽攘攜攅攤攣攫攴攵攷收攸畋效敖敕敍敘敞敝敲數斂斃變斛斟斫斷旃旆旁旄旌旒旛旙无旡旱杲昊昃旻杳昵昶昴昜晏晄晉晁晞晝晤晧晨晟晢晰暃暈暎暉暄暘暝曁暹曉暾暼曄暸曖曚曠昿曦曩曰曵曷朏朖朞朦朧霸朮朿朶杁朸朷杆杞杠杙杣杤枉杰枩杼杪枌枋枦枡枅枷柯枴柬枳柩枸柤柞柝柢柮枹柎柆柧檜栞框栩桀桍栲桎梳栫桙档桷桿梟梏梭梔條梛梃檮梹桴梵梠梺椏梍桾椁棊椈棘椢椦棡椌棍棔棧棕椶椒椄棗棣椥棹棠棯椨椪椚椣椡棆楹楷楜楸楫楔楾楮椹楴椽楙椰楡楞楝榁楪榲榮槐榿槁槓榾槎寨槊槝榻槃榧樮榑榠榜榕榴槞槨樂樛槿權槹槲槧樅榱樞槭樔槫樊樒櫁樣樓橄樌橲樶橸橇橢橙橦橈樸樢檐檍檠檄檢檣檗蘗檻櫃櫂檸檳檬櫞櫑櫟檪櫚櫪櫻欅蘖櫺欒欖鬱欟欸欷盜欹飮歇歃歉歐歙歔歛歟歡歸歹歿殀殄殃殍殘殕殞殤殪殫殯殲殱殳殷殼毆毋毓毟毬毫毳毯麾氈氓气氛氤氣汞汕汢汪沂沍沚沁沛汾汨汳沒沐泄泱泓沽泗泅泝沮沱沾沺泛泯泙泪洟衍洶洫洽洸洙洵洳洒洌浣涓浤浚浹浙涎涕濤涅淹渕渊涵淇淦涸淆淬淞淌淨淒淅淺淙淤淕淪淮渭湮渮渙湲湟渾渣湫渫湶湍渟湃渺湎渤滿渝游溂溪溘滉溷滓溽溯滄溲滔滕溏溥滂溟潁漑灌滬滸滾漿滲漱滯漲滌漾漓滷澆潺潸澁澀潯潛濳潭澂潼潘澎澑濂潦澳澣澡澤澹濆澪濟濕濬濔濘濱濮濛瀉瀋濺瀑瀁瀏濾瀛瀚潴瀝瀘瀟瀰瀾瀲灑灣炙炒炯烱炬炸炳炮烟烋烝烙焉烽焜焙煥煕熈煦煢煌煖煬熏燻熄熕熨熬燗熹熾燒燉燔燎燠燬燧燵燼燹燿爍爐爛爨爭爬爰爲爻爼爿牀牆牋牘牴牾犂犁犇犒犖犢犧犹犲狃狆狄狎狒狢狠狡狹狷倏猗猊猜猖猝猴猯猩猥猾獎獏默獗獪獨獰獸獵獻獺珈玳珎玻珀珥珮珞璢琅瑯琥珸琲琺瑕琿瑟瑙瑁瑜瑩瑰瑣瑪瑶瑾璋璞璧瓊瓏瓔珱瓠瓣瓧瓩瓮瓲瓰瓱瓸瓷甄甃甅甌甎甍甕甓甞甦甬甼畄畍畊畉畛畆畚畩畤畧畫畭畸當疆疇畴疊疉疂疔疚疝疥疣痂疳痃疵疽疸疼疱痍痊痒痙痣痞痾痿痼瘁痰痺痲痳瘋瘍瘉瘟瘧瘠瘡瘢瘤瘴瘰瘻癇癈癆癜癘癡癢癨癩癪癧癬癰癲癶癸發皀皃皈皋皎皖皓皙皚皰皴皸皹皺盂盍盖盒盞盡盥盧盪蘯盻眈眇眄眩眤眞眥眦眛眷眸睇睚睨睫睛睥睿睾睹瞎瞋瞑瞠瞞瞰瞶瞹瞿瞼瞽瞻矇矍矗矚矜矣矮矼砌砒礦砠礪硅碎硴碆硼碚碌碣碵碪碯磑磆磋磔碾碼磅磊磬磧磚磽磴礇礒礑礙礬礫祀祠祗祟祚祕祓祺祿禊禝禧齋禪禮禳禹禺秉秕秧秬秡秣稈稍稘稙稠稟禀稱稻稾稷穃穗穉穡穢穩龝穰穹穽窈窗窕窘窖窩竈窰窶竅竄窿邃竇竊竍竏竕竓站竚竝竡竢竦竭竰笂笏笊笆笳笘笙笞笵笨笶筐筺笄筍笋筌筅筵筥筴筧筰筱筬筮箝箘箟箍箜箚箋箒箏筝箙篋篁篌篏箴篆篝篩簑簔篦篥籠簀簇簓篳篷簗簍篶簣簧簪簟簷簫簽籌籃籔籏籀籐籘籟籤籖籥籬籵粃粐粤粭粢粫粡粨粳粲粱粮粹粽糀糅糂糘糒糜糢鬻糯糲糴糶糺紆紂紜紕紊絅絋紮紲紿紵絆絳絖絎絲絨絮絏絣經綉絛綏絽綛綺綮綣綵緇綽綫總綢綯緜綸綟綰緘緝緤緞緻緲緡縅縊縣縡縒縱縟縉縋縢繆繦縻縵縹繃縷縲縺繧繝繖繞繙繚繹繪繩繼繻纃緕繽辮繿纈纉續纒纐纓纔纖纎纛纜缸缺罅罌罍罎罐网罕罔罘罟罠罨罩罧罸羂羆羃羈羇羌羔羞羝羚羣羯羲羹羮羶羸譱翅翆翊翕翔翡翦翩翳翹飜耆耄耋耒耘耙耜耡耨耿耻聊聆聒聘聚聟聢聨聳聲聰聶聹聽聿肄肆肅肛肓肚肭冐肬胛胥胙胝胄胚胖脉胯胱脛脩脣脯腋隋腆脾腓腑胼腱腮腥腦腴膃膈膊膀膂膠膕膤膣腟膓膩膰膵膾膸膽臀臂膺臉臍臑臙臘臈臚臟臠臧臺臻臾舁舂舅與舊舍舐舖舩舫舸舳艀艙艘艝艚艟艤艢艨艪艫舮艱艷艸艾芍芒芫芟芻芬苡苣苟苒苴苳苺莓范苻苹苞茆苜茉苙茵茴茖茲茱荀茹荐荅茯茫茗茘莅莚莪莟莢莖茣莎莇莊荼莵荳荵莠莉莨菴萓菫菎菽萃菘萋菁菷萇菠菲萍萢萠莽萸蔆菻葭萪萼蕚蒄葷葫蒭葮蒂葩葆萬葯葹萵蓊葢蒹蒿蒟蓙蓍蒻蓚蓐蓁蓆蓖蒡蔡蓿蓴蔗蔘蔬蔟蔕蔔蓼蕀蕣蕘蕈蕁蘂蕋蕕薀薤薈薑薊薨蕭薔薛藪薇薜蕷蕾薐藉薺藏薹藐藕藝藥藜藹蘊蘓蘋藾藺蘆蘢蘚蘰蘿虍乕虔號虧虱蚓蚣蚩蚪蚋蚌蚶蚯蛄蛆蚰蛉蠣蚫蛔蛞蛩蛬蛟蛛蛯蜒蜆蜈蜀蜃蛻蜑蜉蜍蛹蜊蜴蜿蜷蜻蜥蜩蜚蝠蝟蝸蝌蝎蝴蝗蝨蝮蝙蝓蝣蝪蠅螢螟螂螯蟋螽蟀蟐雖螫蟄螳蟇蟆螻蟯蟲蟠蠏蠍蟾蟶蟷蠎蟒蠑蠖蠕蠢蠡蠱蠶蠹蠧蠻衄衂衒衙衞衢衫袁衾袞衵衽袵衲袂袗袒袮袙袢袍袤袰袿袱裃裄裔裘裙裝裹褂裼裴裨裲褄褌褊褓襃褞褥褪褫襁襄褻褶褸襌褝襠襞襦襤襭襪襯襴襷襾覃覈覊覓覘覡覩覦覬覯覲覺覽覿觀觚觜觝觧觴觸訃訖訐訌訛訝訥訶詁詛詒詆詈詼詭詬詢誅誂誄誨誡誑誥誦誚誣諄諍諂諚諫諳諧諤諱謔諠諢諷諞諛謌謇謚諡謖謐謗謠謳鞫謦謫謾謨譁譌譏譎證譖譛譚譫譟譬譯譴譽讀讌讎讒讓讖讙讚谺豁谿豈豌豎豐豕豢豬豸豺貂貉貅貊貍貎貔豼貘戝貭貪貽貲貳貮貶賈賁賤賣賚賽賺賻贄贅贊贇贏贍贐齎贓賍贔贖赧赭赱赳趁趙跂趾趺跏跚跖跌跛跋跪跫跟跣跼踈踉跿踝踞踐踟蹂踵踰踴蹊蹇蹉蹌蹐蹈蹙蹤蹠踪蹣蹕蹶蹲蹼躁躇躅躄躋躊躓躑躔躙躪躡躬躰軆躱躾軅軈軋軛軣軼軻軫軾輊輅輕輒輙輓輜輟輛輌輦輳輻輹轅轂輾轌轉轆轎轗轜轢轣轤辜辟辣辭辯辷迚迥迢迪迯邇迴逅迹迺逑逕逡逍逞逖逋逧逶逵逹迸遏遐遑遒逎遉逾遖遘遞遨遯遶隨遲邂遽邁邀邊邉邏邨邯邱邵郢郤扈郛鄂鄒鄙鄲鄰酊酖酘酣酥酩酳酲醋醉醂醢醫醯醪醵醴醺釀釁釉釋釐釖釟釡釛釼釵釶鈞釿鈔鈬鈕鈑鉞鉗鉅鉉鉤鉈銕鈿鉋鉐銜銖銓銛鉚鋏銹銷鋩錏鋺鍄錮錙錢錚錣錺錵錻鍜鍠鍼鍮鍖鎰鎬鎭鎔鎹鏖鏗鏨鏥鏘鏃鏝鏐鏈鏤鐚鐔鐓鐃鐇鐐鐶鐫鐵鐡鐺鑁鑒鑄鑛鑠鑢鑞鑪鈩鑰鑵鑷鑽鑚鑼鑾钁鑿閂閇閊閔閖閘閙閠閨閧閭閼閻閹閾闊濶闃闍闌闕闔闖關闡闥闢阡阨阮阯陂陌陏陋陷陜陞陝陟陦陲陬隍隘隕隗險隧隱隲隰隴隶隸隹雎雋雉雍襍雜霍雕雹霄霆霈霓霎霑霏霖霙霤霪霰霹霽霾靄靆靈靂靉靜靠靤靦靨勒靫靱靹鞅靼鞁靺鞆鞋鞏鞐鞜鞨鞦鞣鞳鞴韃韆韈韋韜韭齏韲竟韶韵頏頌頸頤頡頷頽顆顏顋顫顯顰顱顴顳颪颯颱颶飄飃飆飩飫餃餉餒餔餘餡餝餞餤餠餬餮餽餾饂饉饅饐饋饑饒饌饕馗馘馥馭馮馼駟駛駝駘駑駭駮駱駲駻駸騁騏騅駢騙騫騷驅驂驀驃騾驕驍驛驗驟驢驥驤驩驫驪骭骰骼髀髏髑髓體髞髟髢髣髦髯髫髮髴髱髷髻鬆鬘鬚鬟鬢鬣鬥鬧鬨鬩鬪鬮鬯鬲魄魃魏魍魎魑魘魴鮓鮃鮑鮖鮗鮟鮠鮨鮴鯀鯊鮹鯆鯏鯑鯒鯣鯢鯤鯔鯡鰺鯲鯱鯰鰕鰔鰉鰓鰌鰆鰈鰒鰊鰄鰮鰛鰥鰤鰡鰰鱇鰲鱆鰾鱚鱠鱧鱶鱸鳧鳬鳰鴉鴈鳫鴃鴆鴪鴦鶯鴣鴟鵄鴕鴒鵁鴿鴾鵆鵈鵝鵞鵤鵑鵐鵙鵲鶉鶇鶫鵯鵺鶚鶤鶩鶲鷄鷁鶻鶸鶺鷆鷏鷂鷙鷓鷸鷦鷭鷯鷽鸚鸛鸞鹵鹹鹽麁麈麋麌麒麕麑麝麥麩麸麪麭靡黌黎黏黐黔黜點黝黠黥黨黯黴黶黷黹黻黼黽鼇鼈皷鼕鼡鼬鼾齊齒齔齣齟齠齡齦齧齬齪齷齲齶龕龜龠堯槇遙瑤凜熙";
        var notForbidStr = kajiJis1Str + fullEjiStr + fullKatakanaStr + fullKajiBmStr + fullKigoStr + fullKigoIbmStr
            + fullSujiStr + halfEjiStr + halfKigoStr + halfSujiStr + hirakanaStr + fullKajiJis2Str;
        // 最小和暦元号
        var minGengo = 1;
        // 最大和暦元号
        var maxGengo = 5;
        // 西暦元号
        var seirekiGengo = 6;
        /**
         * 渡された文字列が空文字列であるか否かをチェック
         *
         * @param {string} chkStr - チェック対象文字列
         * @return {boolean} チェック結果--true：空文字列；false：空文字列ではない
         */
        this.isEmpty = function (chkStr) {
            // チェック対象文字列がnull または ""(ブランク)の場合、チェック結果がtrue。
            if (chkStr == null || chkStr == "") {
                return true;
            }
            else {
                return false;
            }
        };
        /**
         * 渡された文字列に禁則文字が含まれるかをチェック
         *
         * @param {string} chkStr - チェック対象文字列
         * @return {boolean} チェック結果--true：禁則文字が含まれている；false：禁則文字が含まれない
         */
        this.hasForbidChar = function (chkStr) {
            // 文字数が0である場合、チェック結果にfalseをセットし、リターンする。
            if (self.isEmpty(chkStr)) {
                return false;
            }
            var chkResult = false;
            if (chkStr.length > 0) {
                // すべての文字が禁則文字に存在する場合、チェック結果がtrue。
                for (var i = 0; i < chkStr.length; i++) {
                    if (notForbidStr.indexOf(chkStr.charAt(i)) == -1) {
                        chkResult = true;
                        break;
                    }
                }
            }
            return chkResult;
        };
        /**
         * 渡された文字列がすべてフリガナに許された文字であるかをチェック
         *
         * @param {string} chkStr - チェック対象文字列
         * @return {boolean} チェック結果--true：すべてフリガナ文字；false：フリガナ以外の文字が含まれている
         */
        this.isFullHurigana = function (chkStr) {
            if (self.isEmpty(chkStr)) {
                return false;
            }
            // チェック対象文字列が全角カナの場合、チェック結果がtrue。
            if (chkStr.match(/^[\u30fc\u2010\uff10-\uff19\u30a1-\u30ed\u30ef\u30f2-\u30f4]+$/)) {
                return true;
            }
            else {
                return false;
            }
        };
        // /**
        //  * 渡された文字列がすべて銘柄カナに許された文字であるかをチェック
        //  * 
        //  * @param {string} chkStr - チェック対象文字列
        //  * @return {boolean} チェック結果--true：すべて銘柄カナ文字；false：銘柄カナ以外の文字が含まれている
        //  */
        // this.isHalfMgrKana = function(chkStr) {
        //     if (self.isEmpty(chkStr)) {
        //         return false;
        //     }
        //     // チェック対象文字列が銘柄カナの場合、チェック結果がtrue。
        //     if (chkStr.match(/^[\u0020\u002d\u002e\u0030-\u0039\u0041-\u005a\uff66-\uff9f]+$/)) {
        //         return true;
        //     // 銘柄カナ以外の文字が含まれている場合、チェック結果がfalse。
        //     } else {
        //         return false;
        //     }
        // };
        // /**
        //  * 渡された文字列が全てメールアドレスのアカウントに許された文字かをチェック
        //  * 
        //  * @param {string} chkStr - チェック対象文字列
        //  * @return {boolean} チェック結果--true：すべてメールアドレスのアカウント文字；false：メールアドレスのアカウント以外の文字が含まれている
        //  */
        // this.isAccountMailAddr = function(chkStr) {
        //     // 空文字列チェック
        //     if (self.isEmpty(chkStr)) {
        //         return false;
        //     }
        //     // チェック対象文字列がすべてメールアドレス「アカウント部」文字の場合、チェック結果がtrue。
        //     if (chkStr.match(/^[\u0021\u0025\u0026\u002b\u002d-\u0039\u003f\u0041-\u005a\u005f\u0061-\u007a\u007e]+$/)) {
        //         return true;
        //     // メールアドレス「アカウント部」以外の文字が含まれている場合、チェック結果がfalse。
        //     } else {
        //         return false;
        //     }
        // };
        // /**
        //  * 渡された文字列が全てメールアドレスのドメインに許された文字かをチェック
        //  * 
        //  * @param {string} chkStr - チェック対象文字列
        //  * @return {boolean} チェック結果--true：すべてメールアドレスのドメイン文字；false：メールアドレスのドメイン以外の文字が含まれている
        //  */
        // this.isDomainMailAddr = function(chkStr) {
        //     // 空文字列チェック
        //     if (self.isEmpty(chkStr)) {
        //         return false;
        //     }
        //     // 「チェック対象文字列」が「-」（ハイフン）で始まるの場合、チェック結果をfalseで返却する。
        //     if ("-" == chkStr.charAt(0)) {
        //         return false;
        //     }
        //     // 「チェック対象文字列」が「.」（ドット）で連続の場合、チェック結果をfalseで返却する。
        //     if (0 <= chkStr.indexOf("..")) {
        //         return false;
        //     }
        //     // 「チェック対象文字列」が「.」（ドット）で始まるの場合、チェック結果をfalseで返却する。
        //     if ("." == chkStr.charAt(0)) {
        //         return false;
        //     }
        //     // 「チェック対象文字列」が「.」（ドット）で終わるの場合、チェック結果をfalseで返却する。
        //     if ("." == chkStr.charAt(chkStr.length - 1)) {
        //         return false;
        //     }
        //     // 「チェック対象文字列」が「.」（ドット）で含まないの場合、チェック結果をfalseで返却する。
        //     if (-1 == chkStr.indexOf(".")) {
        //         return false;
        //     }
        //     // チェック対象文字列がすべてメールアドレス「ドメイン部」文字の場合、チェック結果がtrue。
        //     if (chkStr.match(/^[\u002d\u002e\u0030-\u0039\u0041-\u005a\u005f\u0061-\u007a]+$/)) {
        //         return true;
        //     // メールアドレス「ドメイン部」以外の文字が含まれている場合、チェック結果がfalse。
        //     } else {
        //         return false;
        //     }
        // };
        /**
         * 渡された文字列がすべて全角文字かをチェック
         *
         * @param {Array} chkStr - チェック対象文字列 もしくは 文字列を分割した配列
         * @return {boolean} チェック結果--true：すべて全角文字；false：全角文字以外の文字が含まれている
         */
        this.isFullString = function (chkStr) {
            if (!Array.isArray(chkStr)) {
                if (self.isEmpty(chkStr)) {
                    return false;
                }
                chkStr = AppBizEmojiUtil.toArray(chkStr);
            }
            for (var i = 0; i < chkStr.length; i++) {
                if (chkStr[i].length > 1) {
                    continue;
                }
                var c = chkStr[i].charCodeAt(0);
                // チェック対象文字列の文字のUnicodeが下記以外である場合、全角と判定する。
                if ((c >= 0x0 && c <= 0x80) || (c == 0xf8f0) || (c >= 0xff61 && c <= 0xff9f) || (c >= 0xf8f1 && c <= 0xf8f3)) {
                    return false;
                }
            }
            return true;
        };
        /**
         * 渡された文字列が数字かをチェック
         *
         * @param {string} chkStr - チェック対象文字列
         * @return {boolean} チェック結果--true：半角数字；false：半角数字以外の文字が含まれている
         */
        this.isNum = function (chkStr) {
            if (self.isEmpty(chkStr)) {
                return false;
            }
            // チェック対象文字列が半角数字の場合、チェック結果がtrue。
            if (chkStr.match(/^[0-9]+$/)) {
                return true;
            }
            else {
                return false;
            }
        };
        /**
         * 渡された文字列の桁数をチェック
         *
         * @param {string} chkStr - チェック対象文字列
         * @param {number} maxLength - 最大桁数
         * @return {number} チェック結果-- 1：入力文字列桁数が最大桁数を超えている；0：入力文字列桁数と最大桁数が等しい；-1：入力文字列桁数が最大桁数に満たない。
         */
        this.chkMaxLength = function (chkStr, maxLength) {
            var chkStrLen;
            if (self.isEmpty(chkStr)) {
                chkStrLen = 0;
            }
            else {
                chkStrLen = chkStr.length;
            }
            // チェック対象文字列の桁数 > 最大桁数 の場合、1をリターンする。
            if (chkStrLen > maxLength) {
                return 1;
            }
            else if (chkStrLen == maxLength) {
                return 0;
            }
            else {
                return -1;
            }
        };
        /**
         * 日付妥当性をチェックし、結果を返却する。
         *
         * @param {string} strGengo - 日付の元号
         * @param {string} strYear - 日付の年
         * @param {string} strMonth - 日付の月
         * @param {string} strDay - 日付の日
         * @return {boolean} チェック結果--true：妥当；false：妥当ではない
         */
        this.isDate = function (strGengo, strYear, strMonth, strDay) {
            if (self.isNum(strGengo) && self.isNum(strYear) && self.isNum(strMonth) && self.isNum(strDay)) {
                // 西暦の場合
                if (seirekiGengo == strGengo) {
                    // 結果をセットし、リターンする。
                    return AppComDate.isDate(strYear, strMonth, strDay);
                }
                else if (minGengo <= strGengo && maxGengo >= strGengo) {
                    // フォーマットされた日付を取得する。
                    var cheResult = AppComDate.convertDate(strGengo, strYear, strMonth, strDay);
                    // 空チェックの結果がfalseの場合、チェック結果がtrue。
                    if (undefined != cheResult) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                else {
                    return false;
                }
            }
            else {
                return false;
            }
        };
        // 01-2022-03-250 ＮＩＳＡ成年年齢引き下げ対応（9月対応 開設年齢引下げ）開始 20220920
        /**
         * 2023年1月1日以降は18歳、2023年1月1日以前は20歳に達しているかをチェック
         *
         * @param {string} gengo - 生年月日元号
         * @param {string} birthYear - 生年月日(年) yyyy
         * @param {string} birthMonth - 生年月日(月) MM
         * @param {string} birthDay - 生年月日(日) dd
         * @param {string} baseDay - 基準日 yyyy-MM-dd
         * @return {boolean} チェック結果--true：成年；false：未成年
         */
        this.isAdult = function (gengo, birthYear, birthMonth, birthDay, baseDay) {
            if (!(this.isEmpty(gengo) || this.isEmpty(birthYear) || this.isEmpty(birthMonth) || this.isEmpty(birthDay) || this.isEmpty(baseDay))) {
                var seirekiYmd = "";
                if (seirekiGengo == gengo && AppComDate.isDate(birthYear, birthMonth, birthDay)) {
                    // 生年月日が実西暦日付の場合
                    seirekiYmd = birthYear + "-" + ("00" + birthMonth).substr(-2) + "-" + ("00" + birthDay).substr(-2);
                }
                else {
                    // 生年月日が和暦の場合、西暦へ変換し処理を行う。
                    seirekiYmd = AppComDate.convertDate(gengo, birthYear, birthMonth, birthDay);
                }
                // 和暦を西暦へ変換成功の場合
                if (undefined != seirekiYmd) {
                    // 「誕生日当日をもって年齢を加算」＜＝「基準日」の場合、チェック結果がtrue。
                    var date = new Date(seirekiYmd);
                    var baseday = new Date(baseDay);
                    var nisabaseday = baseday.getFullYear() + '-01-02';
                    var nisaflagStartDate = new Date(AppComDate.nisaStartDate());
                    var gyomubaseday = new Date(nisabaseday);
                    var adultAge = 18;
                    if (baseday < nisaflagStartDate) {
                        adultAge = 20;
                    }
                    date.setFullYear(date.getFullYear() + adultAge);
                    if (date <= gyomubaseday) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                else {
                    return false;
                }
            }
            else {
                return false;
            }
        };
        /**
         * マイナンバーチェックディジットによる番号整合性チェック
         *
         * @param {string} chkStr - チェック対象文字列
         * @return {boolean} チェック結果--true：マイナンバー；false：マイナンバーではない
         */
        this.isMyNumber = function (chkStr) {
            // 「チェック対象文字列」が空文字列の場合、チェック結果をfalseで返却する。
            if (self.isEmpty(chkStr)) {
                return false;
            }
            // 「チェック対象文字列」の長さが12文字以外の場合、チェック結果をfalseで返却する。
            if (12 != chkStr.length) {
                return false;
            }
            // 「チェック対象文字列」に半角数字以外の文字を含む場合、チェック結果をfalseで返却する。
            if (!self.isNum(chkStr)) {
                return false;
            }
            // チェックディジットの判定
            // n1～n11の合計を11で割った余り ⇒ x
            var remainder = (chkStr.charAt(0) * 6 + chkStr.charAt(1) * 5 + chkStr.charAt(2) * 4 + chkStr.charAt(3) * 3 + chkStr.charAt(4) * 2
                + chkStr.charAt(5) * 7 + chkStr.charAt(6) * 6 + chkStr.charAt(7) * 5 + chkStr.charAt(8) * 4 + chkStr.charAt(9) * 3 + chkStr.charAt(10) * 2) % 11;
            var degit;
            // ｘが0～1の場合、チェックディジット値は0とする。
            if (0 <= remainder && 1 >= remainder) {
                degit = 0;
            }
            else if (2 <= remainder) {
                degit = 11 - remainder;
            }
            // チェック対象文字列の12桁目とチェックディジット値を比較して、不一致の場合はチェック結果をfalseで返却する。
            if (degit != chkStr.charAt(11)) {
                return false;
            }
            else {
                return true;
            }
        };
        var self = this;
    }])
    .factory('AppBizMsg', ['msgDefine', function (msgDefine) {
        return {
            /**
             * メッセージを取得する。
             *
             * @param {string} id - メッセージID
             * @param {array} params - 埋め込み文字列
             */
            getMsg: function (id, params) {
                if (!id) {
                    // idが設定されていない場合はnullを返却する。
                    return null;
                }
                var msgDef = msgDefine[id];
                if (!msgDef) {
                    // idからメッセージ定義が取得できない場合はnullを返却する。
                    return msgDef;
                }
                if (params && Array.isArray(params) && params.length > 0) {
                    // パラメータが設定された場合は埋め込む
                    return msgDef.replace(/{(\d+)}/g, function (match, number) {
                        return typeof params[number] != 'undefined' ? params[number] : match;
                    });
                }
                else {
                    // パラメータが設定されていない場合はそのまま返却
                    return msgDef;
                }
            },
            /**
             * エラーメッセージを画面に表示する。
             *
             * @param {string} errorElementId - エラー項目ID
             * @param {array} msg - エラーメッセージ
             * @param {string} msgID - エラーメッセージID(任意パラメータ)
             */
            showErrorMsgText: function (errorElementId, msg, msgID = '') {
                //エラー項目取得
                var target = $('#' + errorElementId);
                if (target && msg) {
                    //エラーメッセージ表示場所(親element)取得
                    var rowDiv = target.parents('.input-check-row');
                    var nextEle = rowDiv.next();
                    //エラーメッセージを表示
                    var msgDom = '<span class=' + errorElementId + ' data-msgid="' + msgID + '">' + msg + '</span><br class=' + errorElementId + '>';
                    if (nextEle.hasClass('err-message')) {
                        nextEle.html(nextEle.html() + msgDom);
                    }
                    else {
                        rowDiv.after('<div class="err-message">' + msgDom + '</div>');
                    }
                }
            },
            /**
             * エラー赤枠を画面に表示する。
             *
             * @param {string} errorElementId - エラー項目ID
             */
            showErrorItem: function (errorElementId) {
                //エラー項目取得
                var target = $('#' + errorElementId);
                if (target) {
                    //赤枠を表示
                    target.addClass('err');
                    //エラーメッセージ表示場所(親element)取得
                    var rowDiv = target.parents('.input-check-row');
                    //ブロックに赤枠を表示
                    var container = rowDiv.parents('.input-check-area');
                    if (container) {
                        container.addClass('err');
                    }
                }
            },
            /**
             * エラー赤枠（背景のみ）を画面に表示する。
             *
             * @param {string} errorElementId - エラー項目ID
             */
            showErrorBlock: function (errorElementId) {
                //エラー項目取得
                var target = $('#' + errorElementId);
                if (target) {
                    //エラーメッセージ表示場所(親element)取得
                    var rowDiv = target.parents('.input-check-row');
                    //ブロックに赤枠を表示
                    var container = rowDiv.parents('.input-check-area');
                    if (container) {
                        container.addClass('err');
                    }
                }
            },
            /**
             * エラーをクリアする。
             *
             */
            clearAllErrors: function () {
                $('.err-message').remove();
                $('.err').removeClass('err');
            },
            /**
             * エラーをクリアする。(項目単位)
             *
             * @param {string} errorElementId - エラー項目ID
             */
            clearError: function (errorElementId) {
                //エラー項目取得
                var target = $('#' + errorElementId);
                if (target == null || target == undefined) {
                    return;
                }
                //項目の赤枠をクリア
                target.removeClass('err');
                //エラーメッセージ表示場所(親element)取得
                var rowDiv = target.parents('.input-check-row');
                var nextEle = rowDiv.next();
                //エラーメッセージをクリア
                if (nextEle && nextEle.hasClass('err-message')) {
                    $('.' + errorElementId).remove();
                    if ($(nextEle).children().length == 0) {
                        $(nextEle).remove();
                    }
                }
                //親ブロックの赤枠をクリア
                var areaDiv = target.parents('.input-check-area');
                if (areaDiv.find('.err').length == 0) {
                    areaDiv.removeClass('err');
                }
            },
        };
    }])
    .service('AppBizCamera', function () {
    // 運転免許書OCR初期化済みフラグ
    var ocrInited = false;
    // カメラスキャナ初期化済みフラグ
    var scanInited = false;
    /**
     * 運転免許書OCRプラグインの初期化を行う。
     *
     * @param {successCallback} successCallback - 成功時のコールバック関数
     * @param {errorCallback} errorCallback - 失敗時のコールバック関数
     *
     */
    this.initCamOcr = function (successCallback, errorCallback) {
        if (ocrInited) {
            // 初期化済みの場合
            successCallback();
        }
        else {
            try {
                // 正常時ログ出力不要
                PDLCameraOcr.setLogCallback(function () { });
                // 初期化処理
                var changeConfig = function () {
                    // ライブラリの設定の更新                   
                    // カメラOCR設定情報の取得
                    PDLCameraOcr.getConfig(function (config) {
                        // カメラOCR設定情報の更新                
                        // 都道府県を補完する機能有効
                        config.recognitionParam.needsPrefectures = true;
                        PDLCameraOcr.setConfig(config, function () {
                            // 初期化済みとする
                            ocrInited = true;
                            successCallback();
                        }, errorCallback);
                    });
                };
                if (changeConfig != null) {
                    changeConfig();
                }
            }
            catch (error) {
                errorCallback(error);
            }
        }
    };
    /**
     * 運転免許書OCRプラグインのカメラ起動を行う。
     *
     * @param {successCallback} successCallback - 成功時のコールバック関数
     * @param {errorCallback} errorCallback - 失敗時のコールバック関数
     * @param {cancelCallback} cancelCallback - キャンセル時のコールバック関数
     *
     */
    this.startCamOcr = function (successCallback, errorCallback, cancelCallback) {
        new Promise((resolve, reject) => {
            // プラグイン初期化
            try {
                PDLCameraOcr.prepareResource(function () {
                    // 初期化済みとする
                    ocrInited = true;
                    return resolve();
                }, function (error) {
                    return reject(error);
                });
            }
            catch (error) {
                return reject(error);
            }
        }).then(() => {
            return new Promise((resolve, reject) => {
                try {
                    PDLCameraOcr.captureOnce2(function (camInfo) {
                        // successCallback
                        return resolve(camInfo);
                    }, function (error) {
                        if ((-3001 == error.code) || (-4003 == error.code) || (-4004 == error.code)) {
                            // リトライ可能なエラーの場合はシステムエラーとしない
                            var xhr = new XMLHttpRequest();
                            xhr.onload = function () {
                                var reader = new FileReader();
                                reader.onloadend = function () {
                                    // successCallback
                                    var camInfo = {
                                        mode: 0,
                                        cardType: -1,
                                        // 画像データは再撮影を促すイメージを設定
                                        image: reader.result.replace(RegExp('data:;base64,', 'g'), '')
                                    };
                                    return resolve(camInfo);
                                };
                                reader.readAsDataURL(xhr.response);
                            };
                            xhr.open('GET', 'images/NoImage.jpg');
                            xhr.responseType = 'blob';
                            xhr.send();
                        }
                        else {
                            // errorCallback
                            return reject(error);
                        }
                    }, function () {
                        // cancelCallback
                        var error = "cancelCallback";
                        return reject(error);
                    });
                }
                catch (error) {
                    errorCallback(error);
                }
            });
        }).then((camInfo) => {
            return new Promise((resolve, reject) => {
                // プラグイン終了
                try {
                    PDLCameraOcr.deinitResource(function () {
                        return resolve(camInfo);
                    }, function (error) {
                        return reject(error);
                    });
                }
                catch (error) {
                    reject(error);
                }
            });
        }).then((camInfo) => {
            // 成功
            return successCallback(camInfo);
        }).catch((error) => {
            if (error == "cancelCallback") {
                // キャンセル
                return cancelCallback();
            }
            else {
                // 失敗
                return errorCallback(error);
            }
        });
    };
    /**
     * 運転免許書OCRラグインの終了を行う。
     *
     * @param {successCallback} successCallback - 成功時のコールバック関数
     * @param {errorCallback} errorCallback - 失敗時のコールバック関数
     *
     */
    this.deinitCamOcr = function (successCallback, errorCallback) {
        // 何もしない
        successCallback();
    };
    /**
     * カメラスキャナプラグインの初期化を行う。
     *
     * @param {successCallback} successCallback - 成功時のコールバック関数
     * @param {errorCallback} errorCallback - 失敗時のコールバック関数
     *
     */
    this.initCamScan = function (successCallback, errorCallback) {
        if (scanInited) {
            // 初期化済み
            successCallback();
        }
        else {
            try {
                // 正常時ログ出力不要
                PDLCameraScan.setLogCallback(function () { });
                scanInited = true;
                successCallback();
            }
            catch (error) {
                errorCallback(error);
            }
        }
    };
    /**
     * カメラスキャナプラグインのカメラ起動を行う。
     *
     * @param {successCallback} successCallback - 成功時のコールバック関数
     * @param {errorCallback} errorCallback - 失敗時のコールバック関数
     * @param {cancelCallback} cancelCallback - キャンセル時のコールバック関数
     *
     */
    this.startCamScan = function (successCallback, errorCallback, cancelCallback) {
        new Promise((resolve, reject) => {
            // プラグイン初期化
            try {
                PDLCameraScan.prepareResource(function () {
                    // 初期化済みとする
                    ocrInited = true;
                    return resolve();
                }, function (error) {
                    return reject(error);
                });
            }
            catch (error) {
                return reject(error);
            }
        }).then(() => {
            return new Promise((resolve, reject) => {
                try {
                    PDLCameraScan.captureOnce2(function (camInfo) {
                        // successCallback
                        return resolve(camInfo);
                    }, function (error) {
                        // errorCallback
                        return reject(error);
                    }, function () {
                        // cancelCallback
                        var error = "cancelCallback";
                        return reject(error);
                    });
                }
                catch (error) {
                    errorCallback(error);
                }
            });
        }).then((camInfo) => {
            return new Promise((resolve, reject) => {
                // プラグイン終了
                try {
                    PDLCameraScan.deinitResource(function () {
                        return resolve(camInfo);
                    }, function (error) {
                        return reject(error);
                    });
                }
                catch (error) {
                    reject(error);
                }
            });
        }).then((camInfo) => {
            // 成功
            return successCallback(camInfo);
        }).catch((error) => {
            if (error == "cancelCallback") {
                // キャンセル
                return cancelCallback();
            }
            else {
                // 失敗
                return errorCallback(error);
            }
        });
    };
    /**
     * カメラスキャナラグインの終了を行う。
     *
     * @param {successCallback} successCallback - 成功時のコールバック関数
     * @param {errorCallback} errorCallback - 失敗時のコールバック関数
     *
     */
    this.deinitCamScan = function (successCallback, errorCallback) {
        // 何もしない
        successCallback();
    };
})
    .factory('AppBizCheckServTime', ['AppBizDataHolder', 'appConst', 'appDefine', 'AppBizInputCheck', 'AppComHttp', 'AppComDate',
    function (AppBizDataHolder, appConst, appDefine, AppBizInputCheck, AppComHttp, AppComDate) {
        return {
            /**
             * サービス時間情報を設定する。
             *
             * @param {string} startTime - サービス開始時間(HH24MI)
             * @param {string} endTime - サービス終了時間(HH24MI)
             * @param {string} loginEndTime - ログイン終了時間(HH24MI)
             * @param {string} currentDate - サービス営業日(YYYY-MM-DD)
             */
            setServiceTime: function (startTime, endTime, loginEndTime, currentDate) {
                // 共通領域からサービス時間情報を取得する
                var serviceTimeObj = AppBizDataHolder.getServiceTime();
                serviceTimeObj[appDefine.serviceTimeJoho.SRVC_KS_ZKK] = currentDate + ' ' + startTime;
                serviceTimeObj[appDefine.serviceTimeJoho.SRVC_SYRY_ZKK] = currentDate + ' ' + endTime;
                serviceTimeObj[appDefine.serviceTimeJoho.LOGIN_SYRY_ZKK] = currentDate + ' ' + loginEndTime;
                // 共通領域にサービス時間情報を設定する
                AppBizDataHolder.setServiceTime(serviceTimeObj);
            },
            /**
             * アプリ側のサービス時間チェックを行う。
             *
             * @param  {any} onSuccess - 成功時コールバック。
             * @param  {any} onError - 失敗時コールバック。
             * @param  {boolean} isShowIndicator - インジケータ表示フラグ
             */
            checkServiceTime: function (onSuccess, onError, isShowIndicator = true) {
                // 共通領域からサービス時間情報を取得する
                var serviceTimeObj = AppBizDataHolder.getServiceTime();
                var serviceSta = serviceTimeObj[appDefine.serviceTimeJoho.SRVC_KS_ZKK];
                var serviceEnd = serviceTimeObj[appDefine.serviceTimeJoho.SRVC_SYRY_ZKK];
                // 空チェック
                if (AppBizInputCheck.isEmpty(serviceSta) ||
                    AppBizInputCheck.isEmpty(serviceEnd)) {
                    var error = {
                        serviceSta: serviceSta,
                        serviceEnd: serviceEnd
                    };
                    onError(error);
                    return;
                }
                // 端末の現在日時を取得
                var currentDate = AppComDate.getCurrentTimeMillis().substr(11, 8);
                // サービス時間内の場合
                if (currentDate >= serviceSta &&
                    currentDate < serviceEnd) {
                    onSuccess();
                    return;
                }
                else {
                    // インジケータ表示
                    if (isShowIndicator) {
                        $('main').addClass('loadingCircle_blur');
                        $('body').append('<div id="overlay"></div>');
                        $('#overlay').append('<img class="loadingCircle" src="./images/loadingCircle.svg" draggable="false"></img>');
                    }
                    ;
                    // REDOSサーバと疎通確認
                    AppComHttp.post(appConst.SUBIF001.PATH, {}, 
                    // 成功時
                    function (data, status) {
                        // インジケータ削除
                        if (isShowIndicator) {
                            $('#overlay').remove();
                            $('main').removeClass('loadingCircle_blur');
                        }
                        // オンラインの場合
                        if (status == appConst.HTTP_OK) {
                            if (data.RESULT_CODE == appConst.SUBIF001.RESULT_CODE.OK) {
                                onSuccess();
                            }
                            else {
                                onError(data);
                            }
                        }
                        else {
                            onError(status);
                        }
                    }, 
                    // 失敗時
                    function (data, status) {
                        // インジケータ削除
                        if (isShowIndicator) {
                            $('#overlay').remove();
                            $('main').removeClass('loadingCircle_blur');
                        }
                        var error = {
                            data: data,
                            status: status
                        };
                        onError(error);
                    });
                }
            }
        };
    }])
    .factory('AppBizEmojiUtil', [function () {
        return new EmojiUtil();
    }])
    .factory('AppBizDataHolder', function () {
    // ログイン者属性情報
    var LOGIN_ATTRIBUTE = {};
    // 申込データ(事務手続き)情報
    var NOTIF_DETAIL_DATA = {};
    // 申込データ（電子帳票）
    var EFORM_DETAIL_DATA = {};
    // 画像データ情報
    var IMAGE_DATA = {};
    // 画面遷移ルーティング情報
    var PREV_ROUTH_PATH = [];
    // 既契約顧客情報
    var CUST = {};
    // 01-2022-06-224 本人確認書類撮影画面のガード対応 開始 20221031
    // OCR結果データ情報
    var OCR_DATA = {};
    // 01-2022-06-224 本人確認書類撮影画面のガード対応 終了 20221031
    // サービス時間情報
    var SERVICE_TIME = {};
    // コードマスタ情報
    var CD_MASTER = {};
    // 画面遷移制御フラグ情報
    var FLOW_CONTROL_FLG = {};
    // 申込データ(特定個人情報)
    var PERSON_INFO = {};
    // 位置情報
    var LOCATION = {};
    return {
        /**
         * ログイン者属性の取得
         *
         * @return {Object} ログイン者属性情報
         */
        getLoginInfo: function () {
            return LOGIN_ATTRIBUTE;
        },
        /**
         * ログイン者属性の設定
         *
         * @param {Object} value - ログイン者属性情報
         */
        setLoginInfo: function (value) {
            LOGIN_ATTRIBUTE = value;
        },
        /**
         * 申込データ(事務手続き)の取得
         *
         * @return {Object} 申込データ(事務手続き)情報
         */
        getNotifInfo: function () {
            return NOTIF_DETAIL_DATA;
        },
        /**
         * 申込データ(事務手続き)の設定
         *
         * @param {Object} value - 申込データ(事務手続き)情報
         */
        setNotifInfo: function (value) {
            NOTIF_DETAIL_DATA = value;
        },
        /**
         * 申込データ(電子帳票)の取得
         *
         * @return {Object} 申込データ(電子帳票)情報
         */
        getEFormInfo: function () {
            return EFORM_DETAIL_DATA;
        },
        /**
         * 申込データ(電子帳票)の設定
         *
         * @param {Object} value - 申込データ(電子帳票)情報
         */
        setEFormInfo: function (value) {
            EFORM_DETAIL_DATA = value;
        },
        /**
         * 画像データの取得
         *
         * @return {Object} 画像データ情報
         */
        getImageData: function () {
            return IMAGE_DATA;
        },
        /**
         * 画像データの設定
         *
         * @param {Object} value - 画像データ情報
         */
        setImageData: function (value) {
            IMAGE_DATA = value;
        },
        /**
         * 画面遷移ルーティング情報の取得（前画面のパスを取得）
         *
         * @return {Object} 前画面のパス
         */
        getPrevRoutePath: function () {
            var length = PREV_ROUTH_PATH.length;
            if (length < 1) {
                return '';
            }
            return PREV_ROUTH_PATH[length - 1];
        },
        /**
         * 画面遷移ルーティング情報の設定（前画面のパスを登録）
         *
         * @param {string} value - 前画面のパス
         */
        setPrevRoutePath: function (value) {
            PREV_ROUTH_PATH.push(value);
        },
        /**
         * ルーティング情報に指定したパスから最後のパスを削除
         *
         * @param {string} deletePath - 削除開始の画面パス
         */
        deleteRouteInfoByPath: function (deletePath) {
            // routePath配列の長さを取得する
            var length = PREV_ROUTH_PATH.length;
            if (length < 1) {
                return;
            }
            // 削除対象パスのインデックス情報を取得する
            var targetIndex = PREV_ROUTH_PATH.lastIndexOf(deletePath);
            // valueがroutePathに存在する場合
            if (targetIndex > -1) {
                // routePathにdeletePath以降のパスを削除する
                PREV_ROUTH_PATH.splice(targetIndex, length - targetIndex);
            }
        },
        /**
         * ルーティング情報をクリア
         *
         */
        clearRouteInfo: function () {
            PREV_ROUTH_PATH = [];
        },
        /**
         * 既契約顧客情報の取得
         *
         * @return {Object} 既契約顧客情報
         */
        getCustomer: function () {
            return CUST;
        },
        /**
         * 既契約顧客情報の設定
         *
         * @param {Object} value - 既契約顧客情報
         */
        setCustomer: function (value) {
            CUST = value;
        },
        // 01-2022-06-224 本人確認書類撮影画面のガード対応 開始 20221031
        /**
         * OCR結果データの取得
         *
         * @return {Object} OCR結果データ
         */
        getOcrData: function () {
            return OCR_DATA;
        },
        /**
         * OCR結果データの設定
         *
         * @param {Object} value - OCR結果データ
         */
        setOcrData: function (value) {
            OCR_DATA = value;
        },
        // 01-2022-06-224 本人確認書類撮影画面のガード対応 終了 20221031
        /**
         * サービス時間情報の取得
         *
         * @return {Object} サービス時間情報
         */
        getServiceTime: function () {
            return SERVICE_TIME;
        },
        /**
         * サービス時間情報の設定
         *
         * @param {Object} value - サービス時間情報
         */
        setServiceTime: function (value) {
            SERVICE_TIME = value;
        },
        /**
         * コードマスタ情報の取得
         *
         * @return {Array} コードマスタ情報
         */
        getCodeMaster: function () {
            return CD_MASTER;
        },
        /**
         * コードマスタ情報の設定
         *
         * @param {Array} value - コードマスタ情報
         */
        setCodeMaster: function (value) {
            CD_MASTER = value;
        },
        /**
         * 画面遷移制御フラグ情報の取得
         *
         * @return {Object} 画面遷移制御フラグ情報
         */
        getFlowControlFlg: function () {
            return FLOW_CONTROL_FLG;
        },
        /**
         * 画面遷移制御フラグ情報の設定
         *
         * @param {Object} value - 画面遷移制御フラグ情報
         */
        setFlowControlFlg: function (value) {
            FLOW_CONTROL_FLG = value;
        },
        /**
         * 申込データ(特定個人情報)の取得
         *
         * @return {Object} 申込データ(特定個人情報)
         */
        getPersonInfo: function () {
            return PERSON_INFO;
        },
        /**
         * 申込データ(特定個人情報)の設定
         *
         * @param {Object} value - 申込データ(特定個人情報)
         */
        setPersonInfo: function (value) {
            PERSON_INFO = value;
        },
        /**
         * 位置情報の取得
         *
         * @return {Object} 位置情報
         */
        getLocation: function () {
            console.log('位置情報を共通領域から取得');
            return LOCATION;
        },
        /**
         * 位置情報の設定
         *
         * @param {Object} value - 位置情報
         */
        setLocation: function (value) {
            LOCATION = value;
        },
    };
});
