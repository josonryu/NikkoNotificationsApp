/// <reference path='../reference.d.ts' />
/*
    修正履歴
    2020/11/19 インシデント対応 ITI本夛
    振込先口座の登録番号削除の際、登録番号でなく配列のインデックスに基づいて処理がされているインシデントの修正に伴い、共通領域への保存項目を増やす必要があったため修正。
 */

App.constant('appDefine', {

    /**
     * CD-001:申込データ（事務手続き）
     */
    offerDetailData : {
        // 営業員情報
        EIGYOIN_JOHO: {
            KOFU_HSK: "KOFU_HSK",                       // 交付方式
            EIGYOIN_BIKO: "EIGYOIN_BIKO",               // 営業員備考
            PROPER_C: "PROPER_C",                       // 社員ID
            UKETSUKE_MISE_C: "UKETSUKE_MISE_C",         // 受付者店部課コード
            UKETSUKE_KAKARI_C: "UKETSUKE_KAKARI_C"      // 受付者係コード
        },

        // お客さま情報
        KYAK_JOHO: {
            MISE_C: "MISE_C",               // 店部課コード
            KYAK_CIF_C: "KYAK_CIF_C"        // 客コード
        },

        // 申し込み補足情報
        MOSKM_HSK: {
            MOSKM_NICHJ: "MOSKM_NICHJ",     // 申し込み日時
            UUID: "UUID",                   // UUID
            IDO: "IDO",                     // 緯度
            KEIDO: "KEIDO"                  // 経度
        },

        // 受付場所情報
        UKE_JOHO: {
            UKTKBASY_K: "UKTKBASY_K"     // 受付場所区分
        },

        // 入力画面遷移制御
        INPUT_FLG_CONTROL: {
            KYAKNM_F: "KYAKNM_F",                                   // おなまえ変更フラグ
            KYAK_ADDR_F: "KYAK_ADDR_F",                             // ご住所変更フラグ
            TELNO_F: "TELNO_F",                                     // 電話番号変更フラグ
            NIKKO_MRF_F: "NIKKO_MRF_F",                             // 日興MRF変更フラグ
            NIKKO_CARD_F: "NIKKO_CARD_F",                           // 日興カード変更フラグ
            NIKKO_EZ_F: "NIKKO_EZ_F",                               // 日興EZ変更フラグ
            GAIK_SYKN_KOZA_F: "GAIK_SYKN_KOZA_F",                   // 外国証券取引口座変更フラグ
            TKTEI_KOZA_F: "TKTEI_KOZA_F",                           // 特定口座変更フラグ
            TKTEI_KANRI_KOZA_F: "TKTEI_KANRI_KOZA_F",               // 特定管理口座変更フラグ
            KANYUSY_EXP_F: "KANYUSY_EXP_F",                         // 加入者情報拡張登録変更フラグ
            NISA_KOZA_F: "NISA_KOZA_F",                             // NISA口座開設フラグ
            MYNO_KOKUCHI_F: "MYNO_KOKUCHI_F",                       // 個人番号告知フラグ
            KOZA_DEL_F: "KOZA_DEL_F",                               // 振込先口座変更フラグ
            SUKN_HKT_F: "SUKN_HKT_F",                               // 利金・分配金支払方法（包括）変更フラグ
            SUKN_HKT_MEIG_F: "SUKN_HKT_MEIG_F",                     // 利金・分配金支払方法（銘柄）変更フラグ
            GAIK_SYKN_YEN_F: "GAIK_SYKN_YEN_F",                     // 外国証券の円貨利金分配金振込銀行変更フラグ
            RUITOU_SUKN_KAIT_TEIS_F: "RUITOU_SUKN_KAIT_TEIS_F",     // 累投（株投型）分配金買付停止変更フラグ
            HAITKN_SYKN_UKTR_F: "HAITKN_SYKN_UKTR_F"                // 配当金受領方式変更フラグ
        },

        // 番号確認書類情報
        MNSYSEIRY_JOHO: {
            MNSYSEIRY_K: "MNSYSEIRY_K"     // 個人番号確認書類区分
        },

        // 本人確認書類情報
        HONIN_KAKNIN_SY_JOHO: {
            HONIN_KAKNIN_SY_K_1: "HONIN_KAKNIN_SY_K_1",                 // 本人確認書類区分（1種類目）
            HONIN_KAKNIN_SY_YUSO_K_1: "HONIN_KAKNIN_SY_YUSO_K_1",       // 本人確認書類郵送区分（1種類目）
            HONIN_KAKNIN_SY_K_2: "HONIN_KAKNIN_SY_K_2",                 // 本人確認書類区分（2種類目）
            HONIN_KAKNIN_SY_YUSO_K_2: "HONIN_KAKNIN_SY_YUSO_K_2"        // 本人確認書類郵送区分（2種類目）
        },

        // 事務手続き情報
        JIMU_JOHO: {
            KYAKNM_SEI_KNJ: "KYAKNM_SEI_KNJ",                           // 顧客姓（漢字）
            KYAKNM_MEI_KNJ: "KYAKNM_MEI_KNJ",                           // 顧客名（漢字）
            KYAKNM_SEI_KANA: "KYAKNM_SEI_KANA",                         // 顧客姓（カナ）
            KYAKNM_MEI_KANA: "KYAKNM_MEI_KANA",                         // 顧客名（カナ）
            TIIKI_C: "TIIKI_C",                                         // 地域コード
            YUBINNO: "YUBINNO",                                         // 郵便番号
            KYAK_ADDR_FLAG: "KYAK_ADDR_FLAG",                           // 住所入力フラグ
            KYAK_ADDR_TDHKN: "KYAK_ADDR_TDHKN",                         // 都道府県
            KYAK_ADDR_KNJ: "KYAK_ADDR_KNJ",                             // 顧客住所漢字
            KYAK_ADDR_KANA: "KYAK_ADDR_KANA",                           // 顧客住所フリガナ
            KYAK_HOSK_ADDR_KNJ: "KYAK_HOSK_ADDR_KNJ",                   // 補足住所漢字
            KYAK_HOSK_ADDR_KANA: "KYAK_HOSK_ADDR_KANA",                 // 補足住所フリガナ
            KYAK_HOUSENM_KNJ: "KYAK_HOUSENM_KNJ",                       // 建物名漢字
            KYAK_HOUSENM_KANA: "KYAK_HOUSENM_KANA",                     // 建物名フリガナ
            TNKY_GNGO: "TNKY_GNGO",                                     // 転居日元号
            TNKYYMD: "TNKYYMD",                                         // 転居日
            NENSY_JSY: "NENSY_JSY",                                     // 年初住所
            MNSYSEIRY_JISN_FLAG: "MNSYSEIRY_JISN_FLAG",                 // 番号確認書類持参フラグ
            TELNO1: "TELNO1",                                           // 自宅電話番号1
            TELNO2: "TELNO2",                                           // 自宅電話番号2
            TELNO3: "TELNO3",                                           // 自宅電話番号3
            TELNO_DEL: "TELNO_DEL",                                     // 登録抹消（ご自宅電話番号）
            MOBILE_TELNO1: "MOBILE_TELNO1",                             // 携帯電話番号1
            MOBILE_TELNO2: "MOBILE_TELNO2",                             // 携帯電話番号2
            MOBILE_TELNO3: "MOBILE_TELNO3",                             // 携帯電話番号3
            MOBILE_TELNO_DEL: "MOBILE_TELNO_DEL",                       // 登録抹消（携帯電話番号）
            FAXNO1: "FAXNO1",                                           // FAX番号1
            FAXNO2: "FAXNO2",                                           // FAX番号2
            FAXNO3: "FAXNO3",                                           // FAX番号3
            FAXNO_DEL: "FAXNO_DEL",                                     // 登録抹消（FAX番号）
            NIKKO_MRF: "NIKKO_MRF",                                     // 日興MRF累積投資口座申込
            NIKKO_CARD: "NIKKO_CARD",                                   // 日興カード申込区分
            NIKKO_EZ: "NIKKO_EZ",                                       // 日興イージートレード申込区分
            GAIK_SYKN_KOZA: "GAIK_SYKN_KOZA",                           // 外国証券取引口座申込
            TKTEI_KOZA_MSKM: "TKTEI_KOZA_MSKM",                         // 特定口座申込区分
            TKTEI_KOZA_AC: "TKTEI_KOZA_AC",                             // 特定口座勘定区分
            TKTEI_KOZA_GNSN: "TKTEI_KOZA_GNSN",                         // 特定口座源徴区分
            TKTEI_KOZA_YYK: "TKTEI_KOZA_YYK",                           // 特定口座変更予約
            TKTEI_KOZA_NENSY_JSY: "TKTEI_KOZA_NENSY_JSY",               // 特定口座年初住所
            TKTEI_KANRI_KOZA_MSKM: "TKTEI_KANRI_KOZA_MSKM",             // 特定管理口座申込
            KANYUSY_EXP_TORK_K: "KANYUSY_EXP_TORK_K",                   // 加入者情報拡張登録
            NISA_KOZA_MSKM: "NISA_KOZA_MSKM",                           // NISA口座開設
            HIREIHAIBUN: "HIREIHAIBUN",                                 // 株式数比例配分方式申込
            MYNO_KOKUCHI: "MYNO_KOKUCHI",                               // 個人番号告知

            // 振込先口座
            KOZA: [
                // 登録情報区分               // 登録銀行No                  //受取口座                   // 金融機関コード        // 支店コード                // 銀行名                  // 支店名                           // 預金種目                             // 口座番号                                 // 記号                                   // 通帳番号
                {KOZA_TORK_K: "KOZA_TORK_K", KOZA_TORK_NO: "KOZA_TORK_NO", KOZA_UKTRKZ: "KOZA_UKTRKZ", KOZA_BK_C_ADD_BK: "KOZA_BK_C_ADD_BK", KOZA_MISE_C_ADD_BK: "KOZA_MISE_C_ADD_BK", KOZA_BK_NM: "KOZA_BK_NM", KOZA_BK_MISE_NM: "KOZA_BK_MISE_NM", KOZA_YOKNKND_ADD_BK: "KOZA_YOKNKND_ADD_BK", KOZA_KOZA_CD_ADD_BK: "KOZA_KOZA_CD_ADD_BK", KOZA_BK_C_ADD_YUCH: "KOZA_BK_C_ADD_YUCH", YUCH_BK_KOZA_CD_ADD_YUCH: "YUCH_BK_KOZA_CD_ADD_YUCH"},
                {KOZA_TORK_K: "KOZA_TORK_K", KOZA_TORK_NO: "KOZA_TORK_NO", KOZA_UKTRKZ: "KOZA_UKTRKZ", KOZA_BK_C_ADD_BK: "KOZA_BK_C_ADD_BK", KOZA_MISE_C_ADD_BK: "KOZA_MISE_C_ADD_BK", KOZA_BK_NM: "KOZA_BK_NM", KOZA_BK_MISE_NM: "KOZA_BK_MISE_NM", KOZA_YOKNKND_ADD_BK: "KOZA_YOKNKND_ADD_BK", KOZA_KOZA_CD_ADD_BK: "KOZA_KOZA_CD_ADD_BK", KOZA_BK_C_ADD_YUCH: "KOZA_BK_C_ADD_YUCH", YUCH_BK_KOZA_CD_ADD_YUCH: "YUCH_BK_KOZA_CD_ADD_YUCH"}
            ],
            SUKN_HKT_AZKR: "SUKN_HKT_AZKR",                             // 利金・分配金支払方法（包括）預り金入金
            SUKN_HKT_TRKNO: "SUKN_HKT_TRKNO",                           // 利金・分配金支払方法（包括）登録銀行
            SUKN_HKT_MEIG_K: "SUKN_HKT_MEIG_K",                         // 利金・分配金支払方法（銘柄）
            GAIK_SYKN_YEN_SUKN_AZKR: "GAIK_SYKN_YEN_SUKN_AZKR",         // 外証の円貨利金分配金預り金入金
            GAIK_SYKN_YEN_SUKN_BK: "GAIK_SYKN_YEN_SUKN_BK",             // 外証の円貨利金分配金振込銀行
            RUITOU_SUKN_KAIT_TEIS_K: "RUITOU_SUKN_KAIT_TEIS_K",         // 累投（株投型）分配金買付停止区分
            RUITOU_SUKN_TRKNO: "RUITOU_SUKN_TRKNO",                     // 累投（株投型）分配金入金先変更
            HAITKN_SYKN_UKTR_MSKM: "HAITKN_SYKN_UKTR_MSKM",             // 配当金受領方式申込区分
            AMEIG_FURIKOMI: "AMEIG_FURIKOMI",                           // 配当金受領方式（全銘柄振込先指定方式）
            HURIKOMISAKI: "HURIKOMISAKI"                                // 送付先指定
            // 2020/11/19 インシデント対応 追加開始
            ,DEL_KOZA_TORK_NO_LIST:"DEL_KOZA_TORK_NO_LIST"              // 削除対象口座登録Noの一覧
            // 2020/11/19 インシデント対応 追加終了
        },
        
        // 暗証番号情報
        PIN_JOHO: {
            NIKKO_CARD_PIN: "NIKKO_CARD_PIN",           // 日興カード暗証番号
            NIKKO_CARD_MSKM_K: "NIKKO_CARD_MSKM_K"      // 日興カード申し込み確認区分
        },

        // 営業員確認情報
        EIGYOIN_KAKNIN_JOHO: {
            SAIUKEIRE_K: "SAIUKEIRE_K",                     // 氏名変更時の関係書類の再受入れ確認区分
            GAIKA_KOZA_SAITRK_K: "GAIKA_KOZA_SAITRK_K",     // 氏名変更時の外貨振込先口座名再登録確認区分
            EXPTRKHNK_K: "EXPTRKHNK_K",                     // 氏名変更時の拡張登録変更確認区分
            NM_MARUYU_K: "NM_MARUYU_K",                     // 氏名変更時のマル優・特別マル優確認区分
            SEAL_K: "SEAL_K",                               // 氏名変更時の届出印確認区分
            HAITKN_K: "HAITKN_K",                           // 氏名変更時の配当金受領方式確認区分
            SENDSK_HNK_K: "SENDSK_HNK_K",                   // 住所変更時の送付先変更確認区分
            JYS_MARUYU_K: "JYS_MARUYU_K",                   // 住所変更時のマル優・特別マル優確認区分
            JYS_EXPTRKHNK_K: "JYS_EXPTRKHNK_K"              // 住所変更時の拡張登録変更確認区分
        },

        // 確認書類チェック情報
        KAKNIN_SY_CHK_JOHO: {
            HONIN_KAKNIN_SY1_YMTR_K: "HONIN_KAKNIN_SY1_YMTR_K",         // 本人確認書類（1種類目）読み取り可能確認区分
            HONIN_KAKNIN_SY1_UTRK_K: "HONIN_KAKNIN_SY1_UTRK_K",         // 本人確認書類（1種類目）写り込み確認区分
            HONIN_KAKNIN_SY1_SINKYU_K: "HONIN_KAKNIN_SY1_SINKYU_K",     // 本人確認書類（1種類目）新旧情報記載確認区分
            HONIN_KAKNIN_SY1_NRTB_K: "HONIN_KAKNIN_SY1_NRTB_K",         // 本人確認書類（1種類目）自動塗りつぶし確認区分
            HONIN_KAKNIN_SY2_YMTR_K: "HONIN_KAKNIN_SY2_YMTR_K",         // 本人確認書類（2種類目）読み取り可能確認区分
            HONIN_KAKNIN_SY2_UTRK_K: "HONIN_KAKNIN_SY2_UTRK_K",         // 本人確認書類（2種類目）写り込み確認区分
            HONIN_KAKNIN_SY2_SINKYU_K: "HONIN_KAKNIN_SY2_SINKYU_K",     // 本人確認書類（2種類目）新旧情報記載確認区分
            JIDO_NRTBS_KJY: "JIDO_NRTBS_KJY",                           // 自動塗りつぶし解除区分
            HONIN_KAKNIN_SY1_MYNO_K: "HONIN_KAKNIN_SY1_MYNO_K",         // 本人確認書類（1種類目）個人番号記載確認区分
            HONIN_KAKNIN_SY2_MYNO_K: "HONIN_KAKNIN_SY2_MYNO_K"          // 本人確認書類（2種類目）個人番号記載確認区分
        }
    },

    /**
     * CD-002:ログイン者データ
     */
    loginerData : {

        PROPER_C: "PROPER_C",                       // 社員ID
        UKETSUKE_MISE_C: "UKETSUKE_MISE_C",         // 受付者店部課コード
        UKETSUKE_KAKARI_C: "UKETSUKE_KAKARI_C"      // 受付者係コード
    },

    /**
     * CD-003:画像データ
     */
    imageData : {

        HONIN_KAKNIN_SY1_GAZO1: "HONIN_KAKNIN_SY1_GAZO1",       // 本人確認書類1種類目画像1
        HONIN_KAKNIN_SY1_GAZO2: "HONIN_KAKNIN_SY1_GAZO2",       // 本人確認書類1種類目画像2
        HONIN_KAKNIN_SY1_GAZO3: "HONIN_KAKNIN_SY1_GAZO3",       // 本人確認書類1種類目画像3
        HONIN_KAKNIN_SY2_GAZO1: "HONIN_KAKNIN_SY2_GAZO1",       // 本人確認書類2種類目画像1
        HONIN_KAKNIN_SY2_GAZO2: "HONIN_KAKNIN_SY2_GAZO2",       // 本人確認書類2種類目画像2
        HONIN_KAKNIN_SY2_GAZO3: "HONIN_KAKNIN_SY2_GAZO3",       // 本人確認書類2種類目画像3
        AUTO_FILL_GAZO1: "AUTO_FILL_GAZO1",                     // 自動塗りつぶし画像1
        AUTO_FILL_GAZO2: "AUTO_FILL_GAZO2",                     // 自動塗りつぶし画像2
        SYM_GAZO: "SYM_GAZO",                                   // 署名画像
        SYM_STRK: "SYM_STRK",                                   // ストローク情報
        DOC_GAZO: "DOC_GAZO",                                   // 電子署名画像
        DOC_BASE_GAZO: "DOC_BASE_GAZO"                          // 電子帳票雛形画像
    },

    /**
     * CD-004:顧客契約情報
     */
    customerContractJoho : {

        MISE_C: "MISE_C",                                               // 店部課コード
        KYAK_CIF_C: "KYAK_CIF_C",                                       // 顧客コード
        KOZA_OPEN_YMD: "KOZA_OPEN_YMD",                                 // 口座開設日
        KAKARI_C: "KAKARI_C",                                           // 係コード
        KYAKNM_SEI_KNJ: "KYAKNM_SEI_KNJ",                               // 顧客姓（漢字）
        KYAKNM_MEI_KNJ: "KYAKNM_MEI_KNJ",                               // 顧客名（漢字）
        KYAKNM_SEI_KANA: "KYAKNM_SEI_KANA",                             // 顧客姓（カナ）
        KYAKNM_MEI_KANA: "KYAKNM_MEI_KANA",                             // 顧客名（カナ）
        GNGO: "GNGO",                                                   // 元号
        SEINENYMD: "SEINENYMD",                                         // 和暦年月日
        SEX_K: "SEX_K",                                                 // 性別区分
        JSYFMI: "JSYFMI",                                               // 住所不明
        TIIKI_C: "TIIKI_C",                                             // 地域コード
        YUBINNO: "YUBINNO",                                             // 郵便番号
        KYAK_ADDR_KNJ: "KYAK_ADDR_KNJ",                                 // 顧客住所漢字
        KYAK_ADDR_KANA: "KYAK_ADDR_KANA",                               // 顧客住所カナ
        KYAK_HOSK_ADDR_KNJ: "KYAK_HOSK_ADDR_KNJ",                       // 補足住所漢字
        KYAK_HOSK_ADDR_KANA: "KYAK_HOSK_ADDR_KANA",                     // 補足住所フリガナ
        KYAK_HOUSENM_KNJ: "KYAK_HOUSENM_KNJ",                           // 建物名漢字
        KYAK_HOUSENM_KANA: "KYAK_HOUSENM_KANA",                         // 建物名フリガナ
        MYNO_KKC: "MYNO_KKC",                                           // マイナンバー告知
        MARUYU_K: "MARUYU_K",                                           // マル優・マル特契約状態
        DIRECT_K: "DIRECT_K",                                           // ダイレクトコース申込
        TELNO1: "TELNO1",                                               // 自宅電話番号1
        TELNO2: "TELNO2",                                               // 自宅電話番号2
        TELNO3: "TELNO3",                                               // 自宅電話番号3
        MOBILE_TELNO1: "MOBILE_TELNO1",                                 // 携帯電話番号1
        MOBILE_TELNO2: "MOBILE_TELNO2",                                 // 携帯電話番号2
        MOBILE_TELNO3: "MOBILE_TELNO3",                                 // 携帯電話番号3
        FAXNO1: "FAXNO1",                                               // FAX番号1
        FAXNO2: "FAXNO2",                                               // FAX番号2
        FAXNO3: "FAXNO3",                                               // FAX番号3
        NIKKO_MRF: "NIKKO_MRF",                                         // 日興MRF累積投資口座
        NIKKO_CARD: "NIKKO_CARD",                                       // 日興カード発行日
        NIKKO_EZ: "NIKKO_EZ",                                           // 日興イージートレード申込日
        DNS_KOFU_SRV: "DNS_KOFU_SRV",                                   // 電子交付サービス
        GAIK_SYKN_KOZA_OPENYMD: "GAIK_SYKN_KOZA_OPENYMD",               // 外国証券取引口座開設日
        TKTEI_KOZA_OPENYMD: "TKTEI_KOZA_OPENYMD",                       // 特定口座開設日
        TKTEI_KOZA_AC: "TKTEI_KOZA_AC",                                 // 特定口座勘定区分
        TKTEI_KOZA_GNSN: "TKTEI_KOZA_GNSN",                             // 特定口座源徴区分
        TKTEI_KOZA_YYKYMD: "TKTEI_KOZA_YYKYMD",                         // 特定口座源徴予約日
        TKTEI_KOZA_YYK: "TKTEI_KOZA_YYK",                               // 特定口座予約情報
        TKTEI_KOZA_NENSY_TORIHIKIYMD: "TKTEI_KOZA_NENSY_TORIHIKIYMD",   // 特定口座年初取引
        TKTEI_KANRI_KOZA_OPENYMD: "TKTEI_KANRI_KOZA_OPENYMD",           // 特定管理口座開設日
        KAKU_KYAKNM_KNJ: "KAKU_KYAKNM_KNJ",                             // 加入者情報拡張情報（顧客名）
        KAKU_YUBINNO: "KAKU_YUBINNO",                                   // 加入者情報拡張情報（郵便番号）
        KAKU_ADDR: "KAKU_ADDR",                                         // 加入者情報拡張情報（住所）
        NISA_KOZA_OPENYMD: "NISA_KOZA_OPENYMD",                         // NISA口座開設日

        // 振込先口座
        KOZA: [
            // 登録銀行No                  //受取口座                   // 金融機関コード        // 支店コード                // 銀行名                  // 支店名                           // 預金種目                // 口座番号                // 記号                 // 通帳番号                          // 口座名義人カナ
            {KOZA_TRKNO: "KOZA_TRKNO", KOZA_UKTRKZ: "KOZA_UKTRKZ", KOZA_BK_C: "KOZA_BK_C", KOZA_MISE_C: "KOZA_MISE_C", KOZA_BK_NM: "KOZA_BK_NM", KOZA_BK_MISE_NM: "KOZA_BK_MISE_NM", BK_YOKNKND: "BK_YOKNKND", BK_KOZA_CD: "BK_KOZA_CD", YUCH_BK_C: "YUCH_BK_C", YUCH_BK_KOZA_CD: "YUCH_BK_KOZA_CD", BK_KOZA_KANA: "BK_KOZA_KANA"},
            {KOZA_TRKNO: "KOZA_TRKNO", KOZA_UKTRKZ: "KOZA_UKTRKZ", KOZA_BK_C: "KOZA_BK_C", KOZA_MISE_C: "KOZA_MISE_C", KOZA_BK_NM: "KOZA_BK_NM", KOZA_BK_MISE_NM: "KOZA_BK_MISE_NM", BK_YOKNKND: "BK_YOKNKND", BK_KOZA_CD: "BK_KOZA_CD", YUCH_BK_C: "YUCH_BK_C", YUCH_BK_KOZA_CD: "YUCH_BK_KOZA_CD", BK_KOZA_KANA: "BK_KOZA_KANA"},
            {KOZA_TRKNO: "KOZA_TRKNO", KOZA_UKTRKZ: "KOZA_UKTRKZ", KOZA_BK_C: "KOZA_BK_C", KOZA_MISE_C: "KOZA_MISE_C", KOZA_BK_NM: "KOZA_BK_NM", KOZA_BK_MISE_NM: "KOZA_BK_MISE_NM", BK_YOKNKND: "BK_YOKNKND", BK_KOZA_CD: "BK_KOZA_CD", YUCH_BK_C: "YUCH_BK_C", YUCH_BK_KOZA_CD: "YUCH_BK_KOZA_CD", BK_KOZA_KANA: "BK_KOZA_KANA"},
            {KOZA_TRKNO: "KOZA_TRKNO", KOZA_UKTRKZ: "KOZA_UKTRKZ", KOZA_BK_C: "KOZA_BK_C", KOZA_MISE_C: "KOZA_MISE_C", KOZA_BK_NM: "KOZA_BK_NM", KOZA_BK_MISE_NM: "KOZA_BK_MISE_NM", BK_YOKNKND: "BK_YOKNKND", BK_KOZA_CD: "BK_KOZA_CD", YUCH_BK_C: "YUCH_BK_C", YUCH_BK_KOZA_CD: "YUCH_BK_KOZA_CD", BK_KOZA_KANA: "BK_KOZA_KANA"},
            {KOZA_TRKNO: "KOZA_TRKNO", KOZA_UKTRKZ: "KOZA_UKTRKZ", KOZA_BK_C: "KOZA_BK_C", KOZA_MISE_C: "KOZA_MISE_C", KOZA_BK_NM: "KOZA_BK_NM", KOZA_BK_MISE_NM: "KOZA_BK_MISE_NM", BK_YOKNKND: "BK_YOKNKND", BK_KOZA_CD: "BK_KOZA_CD", YUCH_BK_C: "YUCH_BK_C", YUCH_BK_KOZA_CD: "YUCH_BK_KOZA_CD", BK_KOZA_KANA: "BK_KOZA_KANA"},
            {KOZA_TRKNO: "KOZA_TRKNO", KOZA_UKTRKZ: "KOZA_UKTRKZ", KOZA_BK_C: "KOZA_BK_C", KOZA_MISE_C: "KOZA_MISE_C", KOZA_BK_NM: "KOZA_BK_NM", KOZA_BK_MISE_NM: "KOZA_BK_MISE_NM", BK_YOKNKND: "BK_YOKNKND", BK_KOZA_CD: "BK_KOZA_CD", YUCH_BK_C: "YUCH_BK_C", YUCH_BK_KOZA_CD: "YUCH_BK_KOZA_CD", BK_KOZA_KANA: "BK_KOZA_KANA"},
            {KOZA_TRKNO: "KOZA_TRKNO", KOZA_UKTRKZ: "KOZA_UKTRKZ", KOZA_BK_C: "KOZA_BK_C", KOZA_MISE_C: "KOZA_MISE_C", KOZA_BK_NM: "KOZA_BK_NM", KOZA_BK_MISE_NM: "KOZA_BK_MISE_NM", BK_YOKNKND: "BK_YOKNKND", BK_KOZA_CD: "BK_KOZA_CD", YUCH_BK_C: "YUCH_BK_C", YUCH_BK_KOZA_CD: "YUCH_BK_KOZA_CD", BK_KOZA_KANA: "BK_KOZA_KANA"},
            {KOZA_TRKNO: "KOZA_TRKNO", KOZA_UKTRKZ: "KOZA_UKTRKZ", KOZA_BK_C: "KOZA_BK_C", KOZA_MISE_C: "KOZA_MISE_C", KOZA_BK_NM: "KOZA_BK_NM", KOZA_BK_MISE_NM: "KOZA_BK_MISE_NM", BK_YOKNKND: "BK_YOKNKND", BK_KOZA_CD: "BK_KOZA_CD", YUCH_BK_C: "YUCH_BK_C", YUCH_BK_KOZA_CD: "YUCH_BK_KOZA_CD", BK_KOZA_KANA: "BK_KOZA_KANA"},
            {KOZA_TRKNO: "KOZA_TRKNO", KOZA_UKTRKZ: "KOZA_UKTRKZ", KOZA_BK_C: "KOZA_BK_C", KOZA_MISE_C: "KOZA_MISE_C", KOZA_BK_NM: "KOZA_BK_NM", KOZA_BK_MISE_NM: "KOZA_BK_MISE_NM", BK_YOKNKND: "BK_YOKNKND", BK_KOZA_CD: "BK_KOZA_CD", YUCH_BK_C: "YUCH_BK_C", YUCH_BK_KOZA_CD: "YUCH_BK_KOZA_CD", BK_KOZA_KANA: "BK_KOZA_KANA"}
        ],
        SUKN_SITEI_K: "SUKN_SITEI_K",                                               // 利金・分配金支払方法銘柄包括指定区分
        SUKN_SYURUI_K: "SUKN_SYURUI_K",                                             // 利金・分配金支払方法種類
        SUKN_HKT_BK: "SUKN_HKT_BK",                                                 // 利金・分配金支払方法包括登録銀行No
        GAIK_SYKN_YEN_SUKN_BK_HKT: "GAIK_SYKN_YEN_SUKN_BK_HKT",                     // 外証の円貨利金分配金振込銀行（包括）

        // 外証の円貨利金分配金振込銀行（銘柄）
        GAIK_SYKN_YEN_SUKN_BK_MEIG: [
            // 銘柄コード                                                   // 外証の円貨利金分配金振込口座
            { GAIK_SYKN_YEN_SUKN_BK_MEIG_CD: "GAIK_SYKN_YEN_SUKN_BK_MEIG_CD", GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA: "GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA"},
            { GAIK_SYKN_YEN_SUKN_BK_MEIG_CD: "GAIK_SYKN_YEN_SUKN_BK_MEIG_CD", GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA: "GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA"},
            { GAIK_SYKN_YEN_SUKN_BK_MEIG_CD: "GAIK_SYKN_YEN_SUKN_BK_MEIG_CD", GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA: "GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA"},
            { GAIK_SYKN_YEN_SUKN_BK_MEIG_CD: "GAIK_SYKN_YEN_SUKN_BK_MEIG_CD", GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA: "GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA"},
            { GAIK_SYKN_YEN_SUKN_BK_MEIG_CD: "GAIK_SYKN_YEN_SUKN_BK_MEIG_CD", GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA: "GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA"},
            { GAIK_SYKN_YEN_SUKN_BK_MEIG_CD: "GAIK_SYKN_YEN_SUKN_BK_MEIG_CD", GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA: "GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA"},
            { GAIK_SYKN_YEN_SUKN_BK_MEIG_CD: "GAIK_SYKN_YEN_SUKN_BK_MEIG_CD", GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA: "GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA"},
            { GAIK_SYKN_YEN_SUKN_BK_MEIG_CD: "GAIK_SYKN_YEN_SUKN_BK_MEIG_CD", GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA: "GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA"},
            { GAIK_SYKN_YEN_SUKN_BK_MEIG_CD: "GAIK_SYKN_YEN_SUKN_BK_MEIG_CD", GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA: "GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA"},
            { GAIK_SYKN_YEN_SUKN_BK_MEIG_CD: "GAIK_SYKN_YEN_SUKN_BK_MEIG_CD", GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA: "GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA"},
        ],
        HIREIHAIBUN: "HIREIHAIBUN",                                                 // 振替株式の配当金等の証券口座受取申込（配当金受領方式）
        AMEIG_FURIKOMI: "AMEIG_FURIKOMI",                                           // 振替株式の配当金等の証券口座受取申込（全銘柄振込先指定方式）
        SOUHUSAKI_YBN_BNG: "SOUHUSAKI_YBN_BNG",                                     // 送付先新郵便番号
        SOUHUSAKI_JYSY_KNJ: "SOUHUSAKI_JYSY_KNJ",                                   // 送付先住所漢字
        SOUHUSAKI_JYSY_KN: "SOUHUSAKI_JYSY_KN",                                     // 送付先住所カナ
        BK_DAIRI_CHK: "BK_DAIRI_CHK"                                                // 銀行代理業チェック結果
    },

// 01-2022-06-224 本人確認書類撮影画面のガード対応 開始 20221031
    /**
     * CD-005:OCR結果データ
     */
    ocrResultData : {
        MODE: "MODE",           // 撮影モード
        CARD_TYPE: "CARD_TYPE"  // カードタイプ
    },
// 01-2022-06-224 本人確認書類撮影画面のガード対応 終了 20221031

    /**
     * CD-006:サービス時間情報（事務手続き）
     */
    serviceTimeJoho : {

        SRVC_KS_ZKK: "SRVC_KS_ZKK",             // サービス開始時刻
        LOGIN_SYRY_ZKK: "LOGIN_SYRY_ZKK",       // ログイン終了時刻
        SRVC_SYRY_ZKK: "SRVC_SYRY_ZKK",         // サービス終了時刻
        GYOMU_DATE: "GYOMU_DATE"                // 業務日付
    },

    /**
     * CD-007:位置情報
     */
    positionJoho : {

        IDO: "IDO",         // 緯度
        KEIDO: "KEIDO"      // 経度
    },

    /**
     * CD-008:画面遷移制御用フラグ
     */
    pageJumpFlg : {

        // 撮影画面遷移制御
        CAMERA_FLG_CONTROL: {
            MOD_FLG: "MOD_FLG",                                 // 確認書類修正フラグ
            MOD_ID_FLG: "MOD_ID_FLG",                           // 本人確認書類修正フラグ
            SKIP_MASK_FLG: "SKIP_MASK_FLG",                     // 塗りつぶしスキップフラグ（1種類目）
            SKIP_MASK_FLG2: "SKIP_MASK_FLG2"                    // 塗りつぶしスキップフラグ（2種類目）
        },

        // 入力画面遷移制御
        INPUT_FLG_CONTROL: {
            KYAKNM_F: "KYAKNM_F",                                   // おなまえ変更フラグ
            KYAK_ADDR_F: "KYAK_ADDR_F",                             // ご住所変更フラグ
            TELNO_F: "TELNO_F",                                     // 電話番号変更フラグ
            NIKKO_MRF_F: "NIKKO_MRF_F",                             // 日興MRF変更フラグ
            NIKKO_CARD_F: "NIKKO_CARD_F",                           // 日興カード変更フラグ
            NIKKO_EZ_F: "NIKKO_EZ_F",                               // 日興EZ変更フラグ
            GAIK_SYKN_KOZA_F: "GAIK_SYKN_KOZA_F",                   // 外国証券取引口座変更フラグ
            TKTEI_KOZA_F: "TKTEI_KOZA_F",                           // 特定口座変更フラグ
            TKTEI_KANRI_KOZA_F: "TKTEI_KANRI_KOZA_F",               // 特定管理口座変更フラグ
            KANYUSY_EXP_F: "KANYUSY_EXP_F",                         // 加入者情報拡張登録変更フラグ
            NISA_KOZA_F: "NISA_KOZA_F",                             // NISA口座開設フラグ
            MYNO_KOKUCHI_F: "MYNO_KOKUCHI_F",                       // 個人番号告知フラグ
            KOZA_DEL_F: [
                "KOZA_DEL_F",
                "KOZA_DEL_F",
                "KOZA_DEL_F",
                "KOZA_DEL_F",
                "KOZA_DEL_F",
                "KOZA_DEL_F", 
                "KOZA_DEL_F",
                "KOZA_DEL_F",
                "KOZA_DEL_F"],                                      // 振込先口座削除フラグ
            BK_KOZA_ADD_F: "BK_KOZA_ADD_F",                         // 振込先銀行登録フラグ
            YUCH_KOZA_ADD_F: "YUCH_KOZA_ADD_F",                     // 振込先ゆうちょ登録フラグ
            SUKN_HKT_F: "SUKN_HKT_F",                               // 利金・分配金支払方法（包括）変更フラグ
            SUKN_HKT_MEIG_F: "SUKN_HKT_MEIG_F",                     // 利金・分配金支払方法（銘柄）変更フラグ
            GAIK_SYKN_YEN_F: "GAIK_SYKN_YEN_F",                     // 外国証券の円貨利金分配金振込銀行変更フラグ
            RUITOU_SUKN_KAIT_TEIS_F: "RUITOU_SUKN_KAIT_TEIS_F",     // 累投（株投型）分配金買付停止変更フラグ
            HAITKN_SYKN_UKTR_F: "HAITKN_SYKN_UKTR_F"                // 配当金受領方式変更フラグ
        }
    },

    /**
     * CD-009:画面遷移ルーティング情報
     */
    pageJumpRoutingJoho : {

        ROUTING_INFO: "ROUTING_INFO"     // 画面遷移ルーティング情報
    },

    /**
     * CD-010:申込データ（特定個人情報）
     */
    offerMynumberData : {

        MYNO: "MYNO"     // 個人番号
    },

    /**
     * CD-011:マスタ情報
     */
    masterJoho : {

        KBN: "KBN",               // 区分
        CD: "CD",                 // コード
        MSY: "MSY",               // 名称
        STM1: "STM1",             // 補足説明1
        STM2: "STM2",             // 補足説明2
        STM3: "STM3",             // 補足説明3
        STM4: "STM4",             // 補足説明4
        STM5: "STM5",             // 補足説明5
        STM6: "STM6",             // 補足説明6
        DEL_FLG: "DEL_FLG",       // 削除フラグ
        SORT_KEY: "SORT_KEY"      // ソートキー
    },

    /**
     * CD-101:申込データ（電子帳票）
     */
    offerMailData : {

        // 営業員情報
        EIGYOIN_JOHO: {
            PROPER_C: "PROPER_C",                       // 社員ID
            UKETSUKE_MISE_C: "UKETSUKE_MISE_C",         // 受付者店部課コード
            UKETSUKE_KAKARI_C: "UKETSUKE_KAKARI_C"      // 受付者係コード
        },
        
        // お客さま情報
        KYAK_JOHO: {
            MISE_C: "MISE_C",               // 店部課コード
            KYAK_CIF_C: "KYAK_CIF_C"        // 客コード
        },

        // 申し込み補足情報
        MOSKM_HSK: {
            MOSKM_NICHJ: "MOSKM_NICHJ",     // 申し込み日時
            UUID: "UUID",                   // UUID
            IDO: "IDO",                     // 緯度
            KEIDO: "KEIDO"                  // 経度
        },

        // 受付場所情報
        UKE_JOHO: {
            UKTKBASY_K: "UKTKBASY_K"     // 受付場所区分
        },

        // 電子帳票
        CHOHYO: {
            CHOHYO_ID: "CHOHYO_ID",                     // 帳票ID
            MAIL_ACCOUNT: "MAIL_ACCOUNT",               // メールアドレスアカウント名
            MAIL_DOMAIN_FLAG: "MAIL_DOMAIN_FLAG",       // ドメイン名入力フラグ
            MAIL_DOMAIN: "MAIL_DOMAIN",                 // メールアドレスドメイン名
            MAIL_DOMAIN_C: "MAIL_DOMAIN_C"              // メールアドレスドメインコード
        }
    }

});