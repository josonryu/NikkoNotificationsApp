/// <reference path="../reference.d.ts" />

// 現在の接続先情報（デフォルト：本番環境）
App.constant('CURRENT_CONFIG', {
    // APサーバURL
    API_URL: 'http://tablet.app.connect.nikko.co.jp',
    // 暗号化の共通鍵情報（半角16桁）
    CRYPTO_KEY_CBC: 'l3tP4TqnAa6bj2Wj',
    CRYPTO_KEY_ECB: '7ADNqJzD8X2iGlpg',
    // 暗号化のInitial Vector情報（16バイト分のhex文字列）
    INITIAL_VECTOR: '5439664D54386D6D6F78356A30706F49',
});
// テスト環境向け設定
App.constant('TEST_CONFIG', {
    // APサーバURL
    API_URL: 'http://10.206.0.61',
    // 暗号化の共通鍵情報（半角16桁）
    CRYPTO_KEY_CBC: 'TESTvxv3XUCixJK9',
    CRYPTO_KEY_ECB: 'abc123def456gh78',
    // 暗号化のInitial Vector情報（16バイト分のhex文字列）
    INITIAL_VECTOR: '544553546866694C6754586250736A55',
});

// APPモード
App.constant('APP_MODE', { 'PRODUCT': 'product', 'TEST': 'test' });
// アプリ名
App.constant('APL_NAME', '事務手続きアプリ');
//アプリ区分(1:口座開設アプリ;2:事務手続きアプリ)
App.constant('APL_KBN', '2');
// ログ出力レベル
App.constant('LOG_LEVEL_SETTING', 'I');

App.constant('LOG_LEVEL_ORDER',
    {
        'D' : 1,
        'I' : 2,
        'W' : 3,
        'E' : 4,
    }
);
App.constant('LOG_LEVEL',
    {
        'DEBUG'  : 'D',
        'INFO'   : 'I',
        'WARNING': 'W',
        'ERROR'  : 'E',
    }
);

App.constant('appConst', {
    // 画面項目未入力時の共通用域への更新値定義
    NO_INPUT_VALUE: undefined,

    // 撮影書面表示画面用
    CAM_DISPLAY_MODAL: {
        FRONT_NAME: '表面',
        BACK_NAME: '裏面',
        FIRST_NAME: '1枚目',
        SECOND_NAME: '2枚目',
        THIRD_NAME: '3枚目'
    },

    // カメラ撮影画面、撮影結果表示,撮影結果確認画面用
    CAM_TITLE_SUFF: {
        FRONT_NAME: '（表面）',
        BACK_NAME: '（裏面）',
        FIRST_NAME: '（1枚目）',
        SECOND_NAME: '（2枚目）',
        THIRD_NAME: '（3枚目）'
    },

    CARD_TYPE: {
        UNKNOWN: -1,              // 不明
        NOTIFICATION: 1,          // 通知カード
        MY_NUMBER_FRONT: 2,       // 個人番号カード（表面）
        MY_NUMBER_BACK: 3,        // 個人番号カード（裏面）
        DRIVERS_LICENSE_FRONT: 4, // 運転免許証（表面）
        RESIDENCE_CARD: 5,        // 在留カード
        SPECIAL_PERMANENT: 6,     // 特別永住者証明書
        DRIVERS_LICENSE_BACK: 7   // 運転免許証（裏面）
    },

    OCR_SEPALATE_CHAR: '　',
    OCR_UNKNOWN_CHAR: '？',
    OCR_GANNEN: '元年',
    OCR_YEAR_ONE: '1年',

    gengo: {
        gengo1 : {
            name: "明治",
            start: "18680908",
            end:"19120729"
        },

        gengo2 : {
            name: "大正",
            start: "19120730",
            end:"19261224"
        },

        gengo3 : {
            name: "昭和",
            start: "19261225",
            end:"19890107"
        },

        gengo4 : {
            name: "平成",
            start: "19890108",
            end:"20190430"
        },

        gengo5 : {
            name: "令和",
            start: "20190501",
            end:"99999999"
        }
    },
    // 01-2022-03-250 ＮＩＳＡ成年年齢引き下げ対応（9月対応 開設年齢引下げ）開始 20220920
    nisaFlagStartDate: "2023-01-01", //基準日
    // 01-2022-03-250 ＮＩＳＡ成年年齢引き下げ対応（9月対応 開設年齢引下げ）終了 20220920
    // ネットワーク接続可否確認
    SUBIF001: {
        PATH: '/servlet/FwNoBzOperation/ipad/networkState',
        RESULT_CODE: {
            OK         :   1, // 確認結果正常
            OFFLINE    : -98, // サービス時間チェックエラー
            OTHER_ERROR: -99, // その他エラー
        }
    },
    // サービス時間帯・バージョン確認
    SUBIF002: {
        PATH: '/servlet/FwNoBzOperation/ipad/versionCheck',
        RESULT_CODE: {
          OK           :   1, // 各種確認結果正常
          OS_VER_WARN  :   2, // OSバージョン警告
          OS_VER_ERROR :  -2, // OSバージョンチェックエラー
          AP_VER_ERROR :  -3, // アプリバージョンチェックエラー
          OFFLINE      : -98, // オフライン中
          OTHER_ERROR  : -99, // その他エラー
        }
    },
    // 各種マスタデータ更新
    SUBIF003: {
        PATH: '/servlet/FwNoBzOperation/ipad/masterData',
        RESULT_CODE: {
            OK          :   1, // マスタデータ更新情報取得結果正常
            MASTA_ERROR :  -1, // マスタデータ更新情報取得結果エラー
            OFFLINE     : -98, // オフライン中
            OTHER_ERROR : -99, // その他エラー
        }
    },
    // 既契約顧客情報取得
    SUBIF005: {
        PATH: '/servlet/FwNoBzOperation/ipad/customer',
        RESULT_CODE: {
            OK           :   1, // 取得結果正常
            NONE         :  -1, // 取得結果なし（0件）
            CHUKAI_ERROR :  -2, // 仲介業者チェックエラー
            BANK_WORNING :  -3, // 銀行代理業口座開設受付チェック警告
            HOST_ERROR   :  -4, // ホスト帳票閲覧店権限管理チェックエラー
            OFFLINE      : -98, // オフライン中
            OTHER_ERROR  : -99, // その他エラー
        }
    },
    // 電子帳票フォーマット取得要求
    SUBIF006: {
        PATH: '/servlet/FwNoBzOperation/ipad/templateEForm',
        RESULT_CODE: {
            OK          :   1, //送信結果正常
            NONE        :  -1, // 取得結果なし
            OFFLINE     : -98, //オフライン中
            OTHER_ERROR : -99, //その他エラー
        }
    },
    // 事務手続き申込データ送信
    SUBIF008: {
        PATH: '/servlet/FwNoBzOperation/ipad/notificationOffer',
        RESULT_CODE: {
            OK          :   1, //送信結果正常
            OFFLINE    : -98, //オフライン中
            OTHER_ERROR : -99, //その他エラー
        }
    },
    // 電子帳票申込データ送信
    SUBIF009: {
        PATH: '/servlet/FwNoBzOperation/ipad/eFormOffer',
        RESULT_CODE: {
            OK          :   1, //送信結果正常
            OFFLINE    : -98, //オフライン中
            OTHER_ERROR : -99, //その他エラー
        }
    },
    // 操作ログ送信
    SUBIF010: {
        PATH: '/servlet/FwNoBzOperation/ipad/operationLog',
        RESULT_CODE: {
            OK          :   1, //ログデータ受信結果正常
            OK_RECOVERY :   2, //ログデータ受信結果正常 ※リカバリ用ファイル出力
            OTHER_ERROR : -99, //その他エラー
        }
    },
    HTTP_OK: 200,

    // 類似文字リック
    SIMILAR_LINK_LABEL : '入力文字確認',
});

App.constant('chkSimilarConst', {
    // 類似文字チェックモーダルの一行の最大文字数
    LINE_LENGTH: 15,

    // 類似文字チェックタイプ
    SIMILAR_CHECK_TYPE:  {
        /**
         * カナ（氏名・補足住所・建物名）
         * @type {number}
         */
        KANA: 1,
        /**
         * メールアドレス
         * @type {number}
         */
        EMAIL: 2,
        /**
         * カナ・メールアドレス以外
         * @type {number}
         */
        FULL_ALL: 4,
    },

    // 類似文字定義
    SIMILAR_CHAR_DEFINE: [
        // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 開始 20210913  
        /*        
        [
            { target: "１", description: "全角の数字イチ", orderby : "1", type: 1 + 4 },
            { target: "ｌ", description: "全角の英小文字エル", orderby : "2", type: 4 },
            { target: "Ｉ", description: "全角の英大文字アイ", orderby : "3", type: 4 },
            { target: "Ⅰ", description: "全角のローマ数字１", orderby : "4", type: 4 }
        ],
        [
            { target: "一", description: "全角の漢数字１", orderby : "1", type: 4 },
            { target: "‐", description: "全角のハイフン", orderby : "2", type: 4 },
            { target: "ー", description: "全角の長音", orderby : "3", type: 4 },
            { target: "－", description: "全角のハイフンマイナス", orderby : "4", type: 4 },
        ],
        [
            { target: "０", description: "全角の数字ゼロ", orderby : "1", type: 1 + 4 },
            { target: "〇", description: "全角の漢数字０", orderby : "2", type: 4 },
            { target: "Ｏ", description: "全角の英大文字オー", orderby : "3", type: 4 }
        ],
        [
            { target: "ニ", description: "全角のカタカナ", orderby : "1", type: 1 + 4 },
            { target: "二", description: "全角の漢数字２", orderby : "2", type: 4 }
        ],
        [
            { target: "ハ", description: "全角のカタカナ", orderby : "1", type: 1 + 4 },
            { target: "八", description: "全角の漢数字８", orderby : "2", type: 4 }
        ],
        [
            { target: "ロ", description: "全角のカタカナ", orderby : "1", type: 1 + 4 },
            { target: "口", description: "全角の漢字：くち", orderby : "2", type: 4 },
            { target: "囗", description: "全角の漢字：国の略字", orderby : "3", type: 4 }, // JIS第二水準
            { target: "□", description: "全角の四角", orderby : "4", type: 4 }
        ],
        [
            { target: "ヘ", description: "全角のカタカナ", orderby : "1", type: 1 + 4 },
            { target: "へ", description: "全角のひらがな", orderby : "2", type: 4 }
        ],
        [
            { target: "子", description: "全角の漢字：こ", orderby : "1", type: 4 },
            { target: "孑", description: "全角の漢字：げつ", orderby : "2", type: 4 }
        ],
        [
            { target: "丁", description: "全角の漢字：ちょう", orderby : "1", type: 4 },
            { target: "Ｔ", description: "全角の英大文字ティー", orderby : "2", type: 4 }
        ],
        [
            { target: "1", description: "半角の数字イチ", orderby : "1", type: 2 },
            { target: "l", description: "半角の英小文字エル", orderby : "2", type: 2 },
            { target: "I", description: "半角の英大文字アイ", orderby : "3", type: 2 },
        ],
        [
            { target: "0", description: "半角の数字ゼロ", orderby : "1", type: 2 },
            { target: "O", description: "半角の英大文字オー", orderby : "2", type: 2 }
        ],
        */ 
        // 01-2021-06-172 口座開設事務手続きアプリ改善要望対応 終了 20210913 
    ],

});

// DBテーブル定義情報
// DATA_KBN(1:マスタ 2:画像)
App.constant('dbInfoConst', {
    // 1回あたりのSQL実行数
    ONE_SQL_EXEC_COUNT: 10000,
    // マスターデータ情報
    MAST_DATA: {
        DATA_KBN: 1,
        TABLE_NAME: 'MAST_DATA',
        COLUMN_KEY: ['SIKB_ID'],
        COLUMN: [
            { name: 'SIKB_ID', type: 'string' },
        ],
        SEARCH_SQL: 'SELECT DB_UPDJI1, DB_UPDJI2,NYU_USERID,SIKB_ID,MSY,KBN FROM MAST_DATA ORDER BY KBN;',
        UPDATE_SQL: 'UPDATE MAST_DATA SET DB_UPDJI2 = ? WHERE SIKB_ID = ?;'
    },
    // 業務コードマスタ
    CD_MAST_JIMU: {
        DATA_KBN: 1,
        TABLE_NAME: 'CD_MAST_JIMU',
        COLUMN_KEY: ['KBN', 'CD'],
        COLUMN: [
            { name: 'DB_UPDJI1', type: 'string' },
            { name: 'DB_UPDJI2', type: 'string' },
            { name: 'NYU_USERID', type: 'string' },
            { name: 'KBN', type: 'string' },
            { name: 'CD', type: 'string' },
            { name: 'MSY', type: 'string' },
            { name: 'STM1', type: 'string' },
            { name: 'STM2', type: 'string' },
            { name: 'STM3', type: 'string' },
            { name: 'STM4', type: 'string' },
            { name: 'STM5', type: 'string' },
            { name: 'STM6', type: 'string' },
            { name: 'DEL_FLG', type: 'string' },
            { name: 'SORT_KEY', type: 'string' },
        ],
        INSERT_SQL: 'INSERT INTO CD_MAST_JIMU("DB_UPDJI1", "DB_UPDJI2", "NYU_USERID", "KBN", "CD", "MSY", "STM1","STM2","STM3","STM4","STM5","STM6","DEL_FLG","SORT_KEY") VALUES(?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?, ?);',
        DELETE_SQL: 'DELETE FROM CD_MAST_JIMU WHERE KBN = ? AND CD = ? ;'
    },
    // ホスト住所検索用マスタ
    HST_JSYKNSK_MAST: {
        DATA_KBN: 1,
        TABLE_NAME: 'HST_JSYKNSK_MAST',
        COLUMN_KEY: ['KENSKYO_YUBINNO_MAE', 'KENSKYO_YUBINNO_ATO', 'RECNO'],
        COLUMN: [
            { name: 'DB_UPDJI1', type: 'string' },
            { name: 'DB_UPDJI2', type: 'string' },
            { name: 'NYU_USERID', type: 'string' },
            { name: 'KENSKYO_YUBINNO_MAE', type: 'string' },
            { name: 'KENSKYO_YUBINNO_ATO', type: 'string' },
            { name: 'RECNO', type: 'string' },
            { name: 'TIIKI_C', type: 'string' },
            { name: 'TIIKI_C_ADDR', type: 'string' },
            { name: 'TIIKI_C_ADDR_KANA', type: 'string' },
            { name: 'HOSK_ADDR', type: 'string' },
            { name: 'HOSK_ADDR_KANA', type: 'string' },
            { name: 'RONR_MASY_K', type: 'string' },
        ],
        INSERT_SQL: 'INSERT INTO HST_JSYKNSK_MAST("DB_UPDJI1", "DB_UPDJI2", "NYU_USERID", "KENSKYO_YUBINNO_MAE", "KENSKYO_YUBINNO_ATO", "RECNO", "TIIKI_C","TIIKI_C_ADDR","TIIKI_C_ADDR_KANA","HOSK_ADDR","HOSK_ADDR_KANA","RONR_MASY_K") VALUES(?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?);',
        DELETE_SQL: 'DELETE FROM HST_JSYKNSK_MAST WHERE KENSKYO_YUBINNO_MAE = ? AND KENSKYO_YUBINNO_ATO = ? AND RECNO = ?;'
    },
    // 金融機関マスタ
    KINY_INSTTT_MAST: {
        DATA_KBN: 1,
        TABLE_NAME: 'KINY_INSTTT_MAST',
        COLUMN_KEY: ['BK_C', 'BK_MISE_C'],
        COLUMN: [
            { name: 'DB_UPDJI1', type: 'string' },
            { name: 'DB_UPDJI2', type: 'string' },
            { name: 'NYU_USERID', type: 'string' },
            { name: 'BK_C', type: 'string' },
            { name: 'BK_MISE_C', type: 'string' },
            { name: 'BK_FORMNM_KANA', type: 'string' },
            { name: 'BK_FORMNM_KNJ', type: 'string' },
            { name: 'BK_MISE_FORMNM_KANA', type: 'string' },
            { name: 'BK_MISE_FORMNM_KNJ', type: 'string' },
            { name: 'RONR_MASY_K', type: 'string' },
        ],
        INSERT_SQL: 'INSERT INTO KINY_INSTTT_MAST("DB_UPDJI1", "DB_UPDJI2", "NYU_USERID", "BK_C", "BK_MISE_C", "BK_FORMNM_KANA", "BK_FORMNM_KNJ","BK_MISE_FORMNM_KANA","BK_MISE_FORMNM_KNJ","RONR_MASY_K") VALUES(?, ?, ?, ?, ?, ?, ?,?, ?, ?);',
        DELETE_SQL: 'DELETE FROM KINY_INSTTT_MAST WHERE BK_C = ? AND BK_MISE_C = ?;'
    },
    // 通番管理
    KR_RCPT_NO_KNR: {
        DATA_KBN: 1,
        TABLE_NAME: 'KR_RCPT_NO_KNR',
        COLUMN_KEY: ['RCPT_NO_TUBN'],
        COLUMN: [
            { name: 'DB_UPDJI1', type: 'string' },
            { name: 'DB_UPDJI2', type: 'string' },
            { name: 'RCPT_NO_TUBN', type: 'string' },
        ],
        INSERT_SQL: 'INSERT INTO KR_RCPT_NO_KNR("DB_UPDJI1", "DB_UPDJI2", "RCPT_NO_TUBN") VALUES(?, ?, ?);',
        DELETE_SQL: 'DELETE FROM KR_RCPT_NO_KNR WHERE RCPT_NO_TUBN = ? ;'
    },
    'link_identification_img2.png': { DATA_KBN: 2 },
    'link_bangoukakunin_img.png': { DATA_KBN: 2 },
    'link_sogokoza_img2.png': { DATA_KBN: 2 },
    'link_card_img2.png': { DATA_KBN: 2 },
    'link_eztrade_img2.png': { DATA_KBN: 2 },
    'link_gaikokushoken_img2.png': { DATA_KBN: 2 },
    'link_tokutekoza_img2.png': { DATA_KBN: 2 },
    'link_tokuteikanri_img.png': { DATA_KBN: 2 },
    'link_kanyushajouhou_img.png': { DATA_KBN: 2 },
    'link_nisakoza_img2.png': { DATA_KBN: 2 },
    'link_kojinbangou_img.png': { DATA_KBN: 2 },
    'link_uketorikoza_img2.png': { DATA_KBN: 2 },
    'link_houkatu_img.png': { DATA_KBN: 2 },
    'link_meigara_img.png': { DATA_KBN: 2 },
    'link_bunpaikin_img.png': { DATA_KBN: 2 },
    'link_ruitou_img.png': { DATA_KBN: 2 },
    'link_haitokin_img2.png': { DATA_KBN: 2 },
    'link_identification_img3.png': { DATA_KBN: 2 },
    'link_mrf_img2.png': { DATA_KBN: 2 },
});

// 文字変換マップ
App.constant('stringUtilConst', {
    // 絵文字含む全文字のマッチング定義
    REGEXP: /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff]|[\s\S])/g,
    
    // 全角から半角へ変換定義
    FULL_STR: {
        // 数字
        '０': '0', '１': '1', '２': '2', '３': '3', '４': '4',
        '５': '5', '６': '6', '７': '7', '８': '8', '９': '9',
        // 英小文字
        'ａ': 'a', 'ｂ': 'b', 'ｃ': 'c', 'ｄ': 'd', 'ｅ': 'e',
        'ｆ': 'f', 'ｇ': 'g', 'ｈ': 'h', 'ｉ': 'i', 'ｊ': 'j',
        'ｋ': 'k', 'ｌ': 'l', 'ｍ': 'm', 'ｎ': 'n', 'ｏ': 'o',
        'ｐ': 'p', 'ｑ': 'q', 'ｒ': 'r', 'ｓ': 's', 'ｔ': 't',
        'ｕ': 'u', 'ｖ': 'v', 'ｗ': 'w', 'ｘ': 'x', 'ｙ': 'y',
        'ｚ': 'z',
        // 英大文字
        'Ａ': 'A', 'Ｂ': 'B', 'Ｃ': 'C', 'Ｄ': 'D', 'Ｅ': 'E',
        'Ｆ': 'F', 'Ｇ': 'G', 'Ｈ': 'H', 'Ｉ': 'I', 'Ｊ': 'J',
        'Ｋ': 'K', 'Ｌ': 'L', 'Ｍ': 'M', 'Ｎ': 'N', 'Ｏ': 'O',
        'Ｐ': 'P', 'Ｑ': 'Q', 'Ｒ': 'R', 'Ｓ': 'S', 'Ｔ': 'T',
        'Ｕ': 'U', 'Ｖ': 'V', 'Ｗ': 'W', 'Ｘ': 'X', 'Ｙ': 'Y',
        'Ｚ': 'Z',
        // 記号
        '＼': '\\',
        '［': '[',
        '￥': '¥',
        '］': ']',
        '＾': '^',
        '＿': '_',
        'ー': '-',
        '－': '-',
        '‐': '-',
        '‘': '`',
        '｛': '{',
        '｜': '|',
        '｝': '}',
        '～': '~',
        '、': '､',
        '。': '｡',
        '・': '･',
        '「': '｢',
        '」': '｣',
        '：': ':',
        '；': ';',
        '＜': '<',
        '＝': '=',
        '＞': '>',
        '？': '?',
        '＠': '@',
        '！': '!',
        '”': '"',
        '＃': '#',
        '＄': '$',
        '％': '%',
        '＆': '&',
        '／': '/',
        '．': '.',
        '，': ',',
        '＋': '+',
        '＊': '*',
        '（': '(',
        '）': ')',
        '’': "'",
        '　': ' ',
    },
    // 半角から全角へ変換定義
    HALF_STR: {
        // 数字
        '0': '０', '1': '１', '2': '２', '3': '３', '4': '４',
        '5': '５', '6': '６', '7': '７', '8': '８', '9': '９',
        // 英小文字
        'a': 'ａ', 'b': 'ｂ', 'c': 'ｃ', 'd': 'ｄ', 'e': 'ｅ',
        'f': 'ｆ', 'g': 'ｇ', 'h': 'ｈ', 'i': 'ｉ', 'j': 'ｊ',
        'k': 'ｋ', 'l': 'ｌ', 'm': 'ｍ', 'n': 'ｎ', 'o': 'ｏ',
        'p': 'ｐ', 'q': 'ｑ', 'r': 'ｒ', 's': 'ｓ', 't': 'ｔ',
        'u': 'ｕ', 'v': 'ｖ', 'w': 'ｗ', 'x': 'ｘ', 'y': 'ｙ',
        'z': 'ｚ',
         // 英大文字
        'A': 'Ａ', 'B': 'Ｂ', 'C': 'Ｃ', 'D': 'Ｄ', 'E': 'Ｅ',
        'F': 'Ｆ', 'G': 'Ｇ', 'H': 'Ｈ', 'I': 'Ｉ', 'J': 'Ｊ',
        'K': 'Ｋ', 'L': 'Ｌ', 'M': 'Ｍ', 'N': 'Ｎ', 'O': 'Ｏ',
        'P': 'Ｐ', 'Q': 'Ｑ', 'R': 'Ｒ', 'S': 'Ｓ', 'T': 'Ｔ',
        'U': 'Ｕ', 'V': 'Ｖ', 'W': 'Ｗ', 'X': 'Ｘ', 'Y': 'Ｙ',
        'Z': 'Ｚ',
        // 記号
        '\\': '＼',
        '[': '［',
        '¥': '￥',
        ']': '］',
        '^': '＾',
        '_': '＿',
        'ｰ': 'ー',
        '-': '‐',
        '`': '‘',
        '{': '｛',
        '|': '｜',
        '}': '｝',
        '~': '～',
        '､': '、',
        '｡': '。',
        '･': '・',
        '｢': '「',
        '｣': '」',
        ':': '：',
        ';': '；',
        '<': '＜',
        '=': '＝',
        '>': '＞',
        '?': '？',
        '@': '＠',
        '!': '！',
        '"': '”',
        '#': '＃',
        '$': '＄',
        '%': '％',
        '&': '＆',
        '/': '／',
        '.': '．',
        ',': '，',
        '+': '＋',
        '*': '＊',
        '(': '（',
        ')': '）',
        "'": '’',
        ' ': '　',
    },
    // 半角カナから全角カナへ変換定義
    HALF_KANA:{
        'ｶﾞ': 'ガ', 'ｷﾞ': 'ギ', 'ｸﾞ': 'グ', 'ｹﾞ': 'ゲ', 'ｺﾞ': 'ゴ',
        'ｻﾞ': 'ザ', 'ｼﾞ': 'ジ', 'ｽﾞ': 'ズ', 'ｾﾞ': 'ゼ', 'ｿﾞ': 'ゾ',
        'ﾀﾞ': 'ダ', 'ﾁﾞ': 'ヂ', 'ﾂﾞ': 'ヅ', 'ﾃﾞ': 'デ', 'ﾄﾞ': 'ド',
        'ﾊﾞ': 'バ', 'ﾋﾞ': 'ビ', 'ﾌﾞ': 'ブ', 'ﾍﾞ': 'ベ', 'ﾎﾞ': 'ボ',
        'ﾊﾟ': 'パ', 'ﾋﾟ': 'ピ', 'ﾌﾟ': 'プ', 'ﾍﾟ': 'ペ', 'ﾎﾟ': 'ポ',
        'ｳﾞ': 'ヴ',
        'ｱ': 'ア', 'ｲ': 'イ', 'ｳ': 'ウ', 'ｴ': 'エ', 'ｵ': 'オ',
        'ｶ': 'カ', 'ｷ': 'キ', 'ｸ': 'ク', 'ｹ': 'ケ', 'ｺ': 'コ',
        'ｻ': 'サ', 'ｼ': 'シ', 'ｽ': 'ス', 'ｾ': 'セ', 'ｿ': 'ソ',
        'ﾀ': 'タ', 'ﾁ': 'チ', 'ﾂ': 'ツ', 'ﾃ': 'テ', 'ﾄ': 'ト',
        'ﾅ': 'ナ', 'ﾆ': 'ニ', 'ﾇ': 'ヌ', 'ﾈ': 'ネ', 'ﾉ': 'ノ',
        'ﾊ': 'ハ', 'ﾋ': 'ヒ', 'ﾌ': 'フ', 'ﾍ': 'ヘ', 'ﾎ': 'ホ',
        'ﾏ': 'マ', 'ﾐ': 'ミ', 'ﾑ': 'ム', 'ﾒ': 'メ', 'ﾓ': 'モ',
        'ﾔ': 'ヤ', 'ﾕ': 'ユ', 'ﾖ': 'ヨ',
        'ﾗ': 'ラ', 'ﾘ': 'リ', 'ﾙ': 'ル', 'ﾚ': 'レ', 'ﾛ': 'ロ',
        'ﾜ': 'ワ', 'ｦ': 'ヲ', 'ﾝ': 'ン',
        'ｧ': 'ァ', 'ｨ': 'ィ', 'ｩ': 'ゥ', 'ｪ': 'ェ', 'ｫ': 'ォ',
        'ｯ': 'ッ', 'ｬ': 'ャ', 'ｭ': 'ュ', 'ｮ': 'ョ',
    },
    // 全角カナから半角カナへ変換定義
    FULL_KANA:{
        'ガ': 'ｶﾞ', 'ギ': 'ｷﾞ', 'グ': 'ｸﾞ', 'ゲ': 'ｹﾞ', 'ゴ': 'ｺﾞ',
        'ザ': 'ｻﾞ', 'ジ': 'ｼﾞ', 'ズ': 'ｽﾞ', 'ゼ': 'ｾﾞ', 'ゾ': 'ｿﾞ',
        'ダ': 'ﾀﾞ', 'ヂ': 'ﾁﾞ', 'ヅ': 'ﾂﾞ', 'デ': 'ﾃﾞ', 'ド': 'ﾄﾞ',
        'バ': 'ﾊﾞ', 'ビ': 'ﾋﾞ', 'ブ': 'ﾌﾞ', 'ベ': 'ﾍﾞ', 'ボ': 'ﾎﾞ',
        'パ': 'ﾊﾟ', 'ピ': 'ﾋﾟ', 'プ': 'ﾌﾟ', 'ペ': 'ﾍﾟ', 'ポ': 'ﾎﾟ',
        'ヴ': 'ｳﾞ',
        'ア': 'ｱ', 'イ': 'ｲ', 'ウ': 'ｳ', 'エ': 'ｴ', 'オ': 'ｵ',
        'カ': 'ｶ', 'キ': 'ｷ', 'ク': 'ｸ', 'ケ': 'ｹ', 'コ': 'ｺ',
        'サ': 'ｻ', 'シ': 'ｼ', 'ス': 'ｽ', 'セ': 'ｾ', 'ソ': 'ｿ',
        'タ': 'ﾀ', 'チ': 'ﾁ', 'ツ': 'ﾂ', 'テ': 'ﾃ', 'ト': 'ﾄ',
        'ナ': 'ﾅ', 'ニ': 'ﾆ', 'ヌ': 'ﾇ', 'ネ': 'ﾈ', 'ノ': 'ﾉ',
        'ハ': 'ﾊ', 'ヒ': 'ﾋ', 'フ': 'ﾌ', 'ヘ': 'ﾍ', 'ホ': 'ﾎ',
        'マ': 'ﾏ', 'ミ': 'ﾐ', 'ム': 'ﾑ', 'メ': 'ﾒ', 'モ': 'ﾓ',
        'ヤ': 'ﾔ', 'ユ': 'ﾕ', 'ヨ': 'ﾖ',
        'ラ': 'ﾗ', 'リ': 'ﾘ', 'ル': 'ﾙ', 'レ': 'ﾚ', 'ロ': 'ﾛ',
        'ワ': 'ﾜ', 'ヲ': 'ｦ', 'ン': 'ﾝ',
        'ァ': 'ｱ', 'ィ': 'ｲ', 'ゥ': 'ｳ', 'ェ': 'ｴ', 'ォ': 'ｵ',
        'ッ': 'ﾂ', 'ャ': 'ﾔ', 'ュ': 'ﾕ', 'ョ': 'ﾖ',
    },
    // 小カナから大カナへ変更定義
    SMALL_KANA: {
        'ー': '‐', 'ァ': 'ア', 'ィ': 'イ', 'ゥ': 'ウ', 'ェ': 'エ',
        'ォ': 'オ', 'ッ': 'ツ', 'ャ': 'ヤ', 'ュ': 'ユ', 'ョ': 'ヨ'
    }
})