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
    offerDetailData: {
        // 営業員情報
        EIGYOIN_JOHO: {
            KOFU_HSK: "KOFU_HSK",
            EIGYOIN_BIKO: "EIGYOIN_BIKO",
            PROPER_C: "PROPER_C",
            UKETSUKE_MISE_C: "UKETSUKE_MISE_C",
            UKETSUKE_KAKARI_C: "UKETSUKE_KAKARI_C" // 受付者係コード
        },
        // お客さま情報
        KYAK_JOHO: {
            MISE_C: "MISE_C",
            KYAK_CIF_C: "KYAK_CIF_C" // 客コード
        },
        // 申し込み補足情報
        MOSKM_HSK: {
            MOSKM_NICHJ: "MOSKM_NICHJ",
            UUID: "UUID",
            IDO: "IDO",
            KEIDO: "KEIDO" // 経度
        },
        // 受付場所情報
        UKE_JOHO: {
            UKTKBASY_K: "UKTKBASY_K" // 受付場所区分
        },
        // 入力画面遷移制御
        INPUT_FLG_CONTROL: {
            KYAKNM_F: "KYAKNM_F",
            KYAK_ADDR_F: "KYAK_ADDR_F",
            TELNO_F: "TELNO_F",
            NIKKO_MRF_F: "NIKKO_MRF_F",
            NIKKO_CARD_F: "NIKKO_CARD_F",
            NIKKO_EZ_F: "NIKKO_EZ_F",
            GAIK_SYKN_KOZA_F: "GAIK_SYKN_KOZA_F",
            TKTEI_KOZA_F: "TKTEI_KOZA_F",
            TKTEI_KANRI_KOZA_F: "TKTEI_KANRI_KOZA_F",
            KANYUSY_EXP_F: "KANYUSY_EXP_F",
            NISA_KOZA_F: "NISA_KOZA_F",
            MYNO_KOKUCHI_F: "MYNO_KOKUCHI_F",
            KOZA_DEL_F: "KOZA_DEL_F",
            SUKN_HKT_F: "SUKN_HKT_F",
            SUKN_HKT_MEIG_F: "SUKN_HKT_MEIG_F",
            GAIK_SYKN_YEN_F: "GAIK_SYKN_YEN_F",
            RUITOU_SUKN_KAIT_TEIS_F: "RUITOU_SUKN_KAIT_TEIS_F",
            HAITKN_SYKN_UKTR_F: "HAITKN_SYKN_UKTR_F" // 配当金受領方式変更フラグ
        },
        // 番号確認書類情報
        MNSYSEIRY_JOHO: {
            MNSYSEIRY_K: "MNSYSEIRY_K" // 個人番号確認書類区分
        },
        // 本人確認書類情報
        HONIN_KAKNIN_SY_JOHO: {
            HONIN_KAKNIN_SY_K_1: "HONIN_KAKNIN_SY_K_1",
            HONIN_KAKNIN_SY_YUSO_K_1: "HONIN_KAKNIN_SY_YUSO_K_1",
            HONIN_KAKNIN_SY_K_2: "HONIN_KAKNIN_SY_K_2",
            HONIN_KAKNIN_SY_YUSO_K_2: "HONIN_KAKNIN_SY_YUSO_K_2" // 本人確認書類郵送区分（2種類目）
        },
        // 事務手続き情報
        JIMU_JOHO: {
            KYAKNM_SEI_KNJ: "KYAKNM_SEI_KNJ",
            KYAKNM_MEI_KNJ: "KYAKNM_MEI_KNJ",
            KYAKNM_SEI_KANA: "KYAKNM_SEI_KANA",
            KYAKNM_MEI_KANA: "KYAKNM_MEI_KANA",
            TIIKI_C: "TIIKI_C",
            YUBINNO: "YUBINNO",
            KYAK_ADDR_FLAG: "KYAK_ADDR_FLAG",
            KYAK_ADDR_TDHKN: "KYAK_ADDR_TDHKN",
            KYAK_ADDR_KNJ: "KYAK_ADDR_KNJ",
            KYAK_ADDR_KANA: "KYAK_ADDR_KANA",
            KYAK_HOSK_ADDR_KNJ: "KYAK_HOSK_ADDR_KNJ",
            KYAK_HOSK_ADDR_KANA: "KYAK_HOSK_ADDR_KANA",
            KYAK_HOUSENM_KNJ: "KYAK_HOUSENM_KNJ",
            KYAK_HOUSENM_KANA: "KYAK_HOUSENM_KANA",
            TNKY_GNGO: "TNKY_GNGO",
            TNKYYMD: "TNKYYMD",
            NENSY_JSY: "NENSY_JSY",
            MNSYSEIRY_JISN_FLAG: "MNSYSEIRY_JISN_FLAG",
            TELNO1: "TELNO1",
            TELNO2: "TELNO2",
            TELNO3: "TELNO3",
            TELNO_DEL: "TELNO_DEL",
            MOBILE_TELNO1: "MOBILE_TELNO1",
            MOBILE_TELNO2: "MOBILE_TELNO2",
            MOBILE_TELNO3: "MOBILE_TELNO3",
            MOBILE_TELNO_DEL: "MOBILE_TELNO_DEL",
            FAXNO1: "FAXNO1",
            FAXNO2: "FAXNO2",
            FAXNO3: "FAXNO3",
            FAXNO_DEL: "FAXNO_DEL",
            NIKKO_MRF: "NIKKO_MRF",
            NIKKO_CARD: "NIKKO_CARD",
            NIKKO_EZ: "NIKKO_EZ",
            GAIK_SYKN_KOZA: "GAIK_SYKN_KOZA",
            TKTEI_KOZA_MSKM: "TKTEI_KOZA_MSKM",
            TKTEI_KOZA_AC: "TKTEI_KOZA_AC",
            TKTEI_KOZA_GNSN: "TKTEI_KOZA_GNSN",
            TKTEI_KOZA_YYK: "TKTEI_KOZA_YYK",
            TKTEI_KOZA_NENSY_JSY: "TKTEI_KOZA_NENSY_JSY",
            TKTEI_KANRI_KOZA_MSKM: "TKTEI_KANRI_KOZA_MSKM",
            KANYUSY_EXP_TORK_K: "KANYUSY_EXP_TORK_K",
            NISA_KOZA_MSKM: "NISA_KOZA_MSKM",
            HIREIHAIBUN: "HIREIHAIBUN",
            MYNO_KOKUCHI: "MYNO_KOKUCHI",
            // 振込先口座
            KOZA: [
                // 登録情報区分               // 登録銀行No                  //受取口座                   // 金融機関コード        // 支店コード                // 銀行名                  // 支店名                           // 預金種目                             // 口座番号                                 // 記号                                   // 通帳番号
                { KOZA_TORK_K: "KOZA_TORK_K", KOZA_TORK_NO: "KOZA_TORK_NO", KOZA_UKTRKZ: "KOZA_UKTRKZ", KOZA_BK_C_ADD_BK: "KOZA_BK_C_ADD_BK", KOZA_MISE_C_ADD_BK: "KOZA_MISE_C_ADD_BK", KOZA_BK_NM: "KOZA_BK_NM", KOZA_BK_MISE_NM: "KOZA_BK_MISE_NM", KOZA_YOKNKND_ADD_BK: "KOZA_YOKNKND_ADD_BK", KOZA_KOZA_CD_ADD_BK: "KOZA_KOZA_CD_ADD_BK", KOZA_BK_C_ADD_YUCH: "KOZA_BK_C_ADD_YUCH", YUCH_BK_KOZA_CD_ADD_YUCH: "YUCH_BK_KOZA_CD_ADD_YUCH" },
                { KOZA_TORK_K: "KOZA_TORK_K", KOZA_TORK_NO: "KOZA_TORK_NO", KOZA_UKTRKZ: "KOZA_UKTRKZ", KOZA_BK_C_ADD_BK: "KOZA_BK_C_ADD_BK", KOZA_MISE_C_ADD_BK: "KOZA_MISE_C_ADD_BK", KOZA_BK_NM: "KOZA_BK_NM", KOZA_BK_MISE_NM: "KOZA_BK_MISE_NM", KOZA_YOKNKND_ADD_BK: "KOZA_YOKNKND_ADD_BK", KOZA_KOZA_CD_ADD_BK: "KOZA_KOZA_CD_ADD_BK", KOZA_BK_C_ADD_YUCH: "KOZA_BK_C_ADD_YUCH", YUCH_BK_KOZA_CD_ADD_YUCH: "YUCH_BK_KOZA_CD_ADD_YUCH" }
            ],
            SUKN_HKT_AZKR: "SUKN_HKT_AZKR",
            SUKN_HKT_TRKNO: "SUKN_HKT_TRKNO",
            SUKN_HKT_MEIG_K: "SUKN_HKT_MEIG_K",
            GAIK_SYKN_YEN_SUKN_AZKR: "GAIK_SYKN_YEN_SUKN_AZKR",
            GAIK_SYKN_YEN_SUKN_BK: "GAIK_SYKN_YEN_SUKN_BK",
            RUITOU_SUKN_KAIT_TEIS_K: "RUITOU_SUKN_KAIT_TEIS_K",
            RUITOU_SUKN_TRKNO: "RUITOU_SUKN_TRKNO",
            HAITKN_SYKN_UKTR_MSKM: "HAITKN_SYKN_UKTR_MSKM",
            AMEIG_FURIKOMI: "AMEIG_FURIKOMI",
            HURIKOMISAKI: "HURIKOMISAKI" // 送付先指定
            ,
            DEL_KOZA_TORK_NO_LIST: "DEL_KOZA_TORK_NO_LIST" // 削除対象口座登録Noの一覧
        },
        // 暗証番号情報
        PIN_JOHO: {
            NIKKO_CARD_PIN: "NIKKO_CARD_PIN",
            NIKKO_CARD_MSKM_K: "NIKKO_CARD_MSKM_K" // 日興カード申し込み確認区分
        },
        // 営業員確認情報
        EIGYOIN_KAKNIN_JOHO: {
            SAIUKEIRE_K: "SAIUKEIRE_K",
            GAIKA_KOZA_SAITRK_K: "GAIKA_KOZA_SAITRK_K",
            EXPTRKHNK_K: "EXPTRKHNK_K",
            NM_MARUYU_K: "NM_MARUYU_K",
            SEAL_K: "SEAL_K",
            HAITKN_K: "HAITKN_K",
            SENDSK_HNK_K: "SENDSK_HNK_K",
            JYS_MARUYU_K: "JYS_MARUYU_K",
            JYS_EXPTRKHNK_K: "JYS_EXPTRKHNK_K" // 住所変更時の拡張登録変更確認区分
        },
        // 確認書類チェック情報
        KAKNIN_SY_CHK_JOHO: {
            HONIN_KAKNIN_SY1_YMTR_K: "HONIN_KAKNIN_SY1_YMTR_K",
            HONIN_KAKNIN_SY1_UTRK_K: "HONIN_KAKNIN_SY1_UTRK_K",
            HONIN_KAKNIN_SY1_SINKYU_K: "HONIN_KAKNIN_SY1_SINKYU_K",
            HONIN_KAKNIN_SY1_NRTB_K: "HONIN_KAKNIN_SY1_NRTB_K",
            HONIN_KAKNIN_SY2_YMTR_K: "HONIN_KAKNIN_SY2_YMTR_K",
            HONIN_KAKNIN_SY2_UTRK_K: "HONIN_KAKNIN_SY2_UTRK_K",
            HONIN_KAKNIN_SY2_SINKYU_K: "HONIN_KAKNIN_SY2_SINKYU_K",
            JIDO_NRTBS_KJY: "JIDO_NRTBS_KJY",
            HONIN_KAKNIN_SY1_MYNO_K: "HONIN_KAKNIN_SY1_MYNO_K",
            HONIN_KAKNIN_SY2_MYNO_K: "HONIN_KAKNIN_SY2_MYNO_K" // 本人確認書類（2種類目）個人番号記載確認区分
        }
    },
    /**
     * CD-002:ログイン者データ
     */
    loginerData: {
        PROPER_C: "PROPER_C",
        UKETSUKE_MISE_C: "UKETSUKE_MISE_C",
        UKETSUKE_KAKARI_C: "UKETSUKE_KAKARI_C" // 受付者係コード
    },
    /**
     * CD-003:画像データ
     */
    imageData: {
        HONIN_KAKNIN_SY1_GAZO1: "HONIN_KAKNIN_SY1_GAZO1",
        HONIN_KAKNIN_SY1_GAZO2: "HONIN_KAKNIN_SY1_GAZO2",
        HONIN_KAKNIN_SY1_GAZO3: "HONIN_KAKNIN_SY1_GAZO3",
        HONIN_KAKNIN_SY2_GAZO1: "HONIN_KAKNIN_SY2_GAZO1",
        HONIN_KAKNIN_SY2_GAZO2: "HONIN_KAKNIN_SY2_GAZO2",
        HONIN_KAKNIN_SY2_GAZO3: "HONIN_KAKNIN_SY2_GAZO3",
        AUTO_FILL_GAZO1: "AUTO_FILL_GAZO1",
        AUTO_FILL_GAZO2: "AUTO_FILL_GAZO2",
        SYM_GAZO: "SYM_GAZO",
        SYM_STRK: "SYM_STRK",
        DOC_GAZO: "DOC_GAZO",
        DOC_BASE_GAZO: "DOC_BASE_GAZO" // 電子帳票雛形画像
    },
    /**
     * CD-004:顧客契約情報
     */
    customerContractJoho: {
        MISE_C: "MISE_C",
        KYAK_CIF_C: "KYAK_CIF_C",
        KOZA_OPEN_YMD: "KOZA_OPEN_YMD",
        KAKARI_C: "KAKARI_C",
        KYAKNM_SEI_KNJ: "KYAKNM_SEI_KNJ",
        KYAKNM_MEI_KNJ: "KYAKNM_MEI_KNJ",
        KYAKNM_SEI_KANA: "KYAKNM_SEI_KANA",
        KYAKNM_MEI_KANA: "KYAKNM_MEI_KANA",
        GNGO: "GNGO",
        SEINENYMD: "SEINENYMD",
        SEX_K: "SEX_K",
        JSYFMI: "JSYFMI",
        TIIKI_C: "TIIKI_C",
        YUBINNO: "YUBINNO",
        KYAK_ADDR_KNJ: "KYAK_ADDR_KNJ",
        KYAK_ADDR_KANA: "KYAK_ADDR_KANA",
        KYAK_HOSK_ADDR_KNJ: "KYAK_HOSK_ADDR_KNJ",
        KYAK_HOSK_ADDR_KANA: "KYAK_HOSK_ADDR_KANA",
        KYAK_HOUSENM_KNJ: "KYAK_HOUSENM_KNJ",
        KYAK_HOUSENM_KANA: "KYAK_HOUSENM_KANA",
        MYNO_KKC: "MYNO_KKC",
        MARUYU_K: "MARUYU_K",
        DIRECT_K: "DIRECT_K",
        TELNO1: "TELNO1",
        TELNO2: "TELNO2",
        TELNO3: "TELNO3",
        MOBILE_TELNO1: "MOBILE_TELNO1",
        MOBILE_TELNO2: "MOBILE_TELNO2",
        MOBILE_TELNO3: "MOBILE_TELNO3",
        FAXNO1: "FAXNO1",
        FAXNO2: "FAXNO2",
        FAXNO3: "FAXNO3",
        NIKKO_MRF: "NIKKO_MRF",
        NIKKO_CARD: "NIKKO_CARD",
        NIKKO_EZ: "NIKKO_EZ",
        DNS_KOFU_SRV: "DNS_KOFU_SRV",
        GAIK_SYKN_KOZA_OPENYMD: "GAIK_SYKN_KOZA_OPENYMD",
        TKTEI_KOZA_OPENYMD: "TKTEI_KOZA_OPENYMD",
        TKTEI_KOZA_AC: "TKTEI_KOZA_AC",
        TKTEI_KOZA_GNSN: "TKTEI_KOZA_GNSN",
        TKTEI_KOZA_YYKYMD: "TKTEI_KOZA_YYKYMD",
        TKTEI_KOZA_YYK: "TKTEI_KOZA_YYK",
        TKTEI_KOZA_NENSY_TORIHIKIYMD: "TKTEI_KOZA_NENSY_TORIHIKIYMD",
        TKTEI_KANRI_KOZA_OPENYMD: "TKTEI_KANRI_KOZA_OPENYMD",
        KAKU_KYAKNM_KNJ: "KAKU_KYAKNM_KNJ",
        KAKU_YUBINNO: "KAKU_YUBINNO",
        KAKU_ADDR: "KAKU_ADDR",
        NISA_KOZA_OPENYMD: "NISA_KOZA_OPENYMD",
        // 振込先口座
        KOZA: [
            // 登録銀行No                  //受取口座                   // 金融機関コード        // 支店コード                // 銀行名                  // 支店名                           // 預金種目                // 口座番号                // 記号                 // 通帳番号                          // 口座名義人カナ
            { KOZA_TRKNO: "KOZA_TRKNO", KOZA_UKTRKZ: "KOZA_UKTRKZ", KOZA_BK_C: "KOZA_BK_C", KOZA_MISE_C: "KOZA_MISE_C", KOZA_BK_NM: "KOZA_BK_NM", KOZA_BK_MISE_NM: "KOZA_BK_MISE_NM", BK_YOKNKND: "BK_YOKNKND", BK_KOZA_CD: "BK_KOZA_CD", YUCH_BK_C: "YUCH_BK_C", YUCH_BK_KOZA_CD: "YUCH_BK_KOZA_CD", BK_KOZA_KANA: "BK_KOZA_KANA" },
            { KOZA_TRKNO: "KOZA_TRKNO", KOZA_UKTRKZ: "KOZA_UKTRKZ", KOZA_BK_C: "KOZA_BK_C", KOZA_MISE_C: "KOZA_MISE_C", KOZA_BK_NM: "KOZA_BK_NM", KOZA_BK_MISE_NM: "KOZA_BK_MISE_NM", BK_YOKNKND: "BK_YOKNKND", BK_KOZA_CD: "BK_KOZA_CD", YUCH_BK_C: "YUCH_BK_C", YUCH_BK_KOZA_CD: "YUCH_BK_KOZA_CD", BK_KOZA_KANA: "BK_KOZA_KANA" },
            { KOZA_TRKNO: "KOZA_TRKNO", KOZA_UKTRKZ: "KOZA_UKTRKZ", KOZA_BK_C: "KOZA_BK_C", KOZA_MISE_C: "KOZA_MISE_C", KOZA_BK_NM: "KOZA_BK_NM", KOZA_BK_MISE_NM: "KOZA_BK_MISE_NM", BK_YOKNKND: "BK_YOKNKND", BK_KOZA_CD: "BK_KOZA_CD", YUCH_BK_C: "YUCH_BK_C", YUCH_BK_KOZA_CD: "YUCH_BK_KOZA_CD", BK_KOZA_KANA: "BK_KOZA_KANA" },
            { KOZA_TRKNO: "KOZA_TRKNO", KOZA_UKTRKZ: "KOZA_UKTRKZ", KOZA_BK_C: "KOZA_BK_C", KOZA_MISE_C: "KOZA_MISE_C", KOZA_BK_NM: "KOZA_BK_NM", KOZA_BK_MISE_NM: "KOZA_BK_MISE_NM", BK_YOKNKND: "BK_YOKNKND", BK_KOZA_CD: "BK_KOZA_CD", YUCH_BK_C: "YUCH_BK_C", YUCH_BK_KOZA_CD: "YUCH_BK_KOZA_CD", BK_KOZA_KANA: "BK_KOZA_KANA" },
            { KOZA_TRKNO: "KOZA_TRKNO", KOZA_UKTRKZ: "KOZA_UKTRKZ", KOZA_BK_C: "KOZA_BK_C", KOZA_MISE_C: "KOZA_MISE_C", KOZA_BK_NM: "KOZA_BK_NM", KOZA_BK_MISE_NM: "KOZA_BK_MISE_NM", BK_YOKNKND: "BK_YOKNKND", BK_KOZA_CD: "BK_KOZA_CD", YUCH_BK_C: "YUCH_BK_C", YUCH_BK_KOZA_CD: "YUCH_BK_KOZA_CD", BK_KOZA_KANA: "BK_KOZA_KANA" },
            { KOZA_TRKNO: "KOZA_TRKNO", KOZA_UKTRKZ: "KOZA_UKTRKZ", KOZA_BK_C: "KOZA_BK_C", KOZA_MISE_C: "KOZA_MISE_C", KOZA_BK_NM: "KOZA_BK_NM", KOZA_BK_MISE_NM: "KOZA_BK_MISE_NM", BK_YOKNKND: "BK_YOKNKND", BK_KOZA_CD: "BK_KOZA_CD", YUCH_BK_C: "YUCH_BK_C", YUCH_BK_KOZA_CD: "YUCH_BK_KOZA_CD", BK_KOZA_KANA: "BK_KOZA_KANA" },
            { KOZA_TRKNO: "KOZA_TRKNO", KOZA_UKTRKZ: "KOZA_UKTRKZ", KOZA_BK_C: "KOZA_BK_C", KOZA_MISE_C: "KOZA_MISE_C", KOZA_BK_NM: "KOZA_BK_NM", KOZA_BK_MISE_NM: "KOZA_BK_MISE_NM", BK_YOKNKND: "BK_YOKNKND", BK_KOZA_CD: "BK_KOZA_CD", YUCH_BK_C: "YUCH_BK_C", YUCH_BK_KOZA_CD: "YUCH_BK_KOZA_CD", BK_KOZA_KANA: "BK_KOZA_KANA" },
            { KOZA_TRKNO: "KOZA_TRKNO", KOZA_UKTRKZ: "KOZA_UKTRKZ", KOZA_BK_C: "KOZA_BK_C", KOZA_MISE_C: "KOZA_MISE_C", KOZA_BK_NM: "KOZA_BK_NM", KOZA_BK_MISE_NM: "KOZA_BK_MISE_NM", BK_YOKNKND: "BK_YOKNKND", BK_KOZA_CD: "BK_KOZA_CD", YUCH_BK_C: "YUCH_BK_C", YUCH_BK_KOZA_CD: "YUCH_BK_KOZA_CD", BK_KOZA_KANA: "BK_KOZA_KANA" },
            { KOZA_TRKNO: "KOZA_TRKNO", KOZA_UKTRKZ: "KOZA_UKTRKZ", KOZA_BK_C: "KOZA_BK_C", KOZA_MISE_C: "KOZA_MISE_C", KOZA_BK_NM: "KOZA_BK_NM", KOZA_BK_MISE_NM: "KOZA_BK_MISE_NM", BK_YOKNKND: "BK_YOKNKND", BK_KOZA_CD: "BK_KOZA_CD", YUCH_BK_C: "YUCH_BK_C", YUCH_BK_KOZA_CD: "YUCH_BK_KOZA_CD", BK_KOZA_KANA: "BK_KOZA_KANA" }
        ],
        SUKN_SITEI_K: "SUKN_SITEI_K",
        SUKN_SYURUI_K: "SUKN_SYURUI_K",
        SUKN_HKT_BK: "SUKN_HKT_BK",
        GAIK_SYKN_YEN_SUKN_BK_HKT: "GAIK_SYKN_YEN_SUKN_BK_HKT",
        // 外証の円貨利金分配金振込銀行（銘柄）
        GAIK_SYKN_YEN_SUKN_BK_MEIG: [
            // 銘柄コード                                                   // 外証の円貨利金分配金振込口座
            { GAIK_SYKN_YEN_SUKN_BK_MEIG_CD: "GAIK_SYKN_YEN_SUKN_BK_MEIG_CD", GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA: "GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA" },
            { GAIK_SYKN_YEN_SUKN_BK_MEIG_CD: "GAIK_SYKN_YEN_SUKN_BK_MEIG_CD", GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA: "GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA" },
            { GAIK_SYKN_YEN_SUKN_BK_MEIG_CD: "GAIK_SYKN_YEN_SUKN_BK_MEIG_CD", GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA: "GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA" },
            { GAIK_SYKN_YEN_SUKN_BK_MEIG_CD: "GAIK_SYKN_YEN_SUKN_BK_MEIG_CD", GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA: "GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA" },
            { GAIK_SYKN_YEN_SUKN_BK_MEIG_CD: "GAIK_SYKN_YEN_SUKN_BK_MEIG_CD", GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA: "GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA" },
            { GAIK_SYKN_YEN_SUKN_BK_MEIG_CD: "GAIK_SYKN_YEN_SUKN_BK_MEIG_CD", GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA: "GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA" },
            { GAIK_SYKN_YEN_SUKN_BK_MEIG_CD: "GAIK_SYKN_YEN_SUKN_BK_MEIG_CD", GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA: "GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA" },
            { GAIK_SYKN_YEN_SUKN_BK_MEIG_CD: "GAIK_SYKN_YEN_SUKN_BK_MEIG_CD", GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA: "GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA" },
            { GAIK_SYKN_YEN_SUKN_BK_MEIG_CD: "GAIK_SYKN_YEN_SUKN_BK_MEIG_CD", GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA: "GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA" },
            { GAIK_SYKN_YEN_SUKN_BK_MEIG_CD: "GAIK_SYKN_YEN_SUKN_BK_MEIG_CD", GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA: "GAIK_SYKN_YEN_SUKN_BK_MEIG_KOZA" },
        ],
        HIREIHAIBUN: "HIREIHAIBUN",
        AMEIG_FURIKOMI: "AMEIG_FURIKOMI",
        SOUHUSAKI_YBN_BNG: "SOUHUSAKI_YBN_BNG",
        SOUHUSAKI_JYSY_KNJ: "SOUHUSAKI_JYSY_KNJ",
        SOUHUSAKI_JYSY_KN: "SOUHUSAKI_JYSY_KN",
        BK_DAIRI_CHK: "BK_DAIRI_CHK" // 銀行代理業チェック結果
    },
    // 01-2022-06-224 本人確認書類撮影画面のガード対応 開始 20221031
    /**
     * CD-005:OCR結果データ
     */
    ocrResultData: {
        MODE: "MODE",
        CARD_TYPE: "CARD_TYPE" // カードタイプ
    },
    // 01-2022-06-224 本人確認書類撮影画面のガード対応 終了 20221031
    /**
     * CD-006:サービス時間情報（事務手続き）
     */
    serviceTimeJoho: {
        SRVC_KS_ZKK: "SRVC_KS_ZKK",
        LOGIN_SYRY_ZKK: "LOGIN_SYRY_ZKK",
        SRVC_SYRY_ZKK: "SRVC_SYRY_ZKK",
        GYOMU_DATE: "GYOMU_DATE" // 業務日付
    },
    /**
     * CD-007:位置情報
     */
    positionJoho: {
        IDO: "IDO",
        KEIDO: "KEIDO" // 経度
    },
    /**
     * CD-008:画面遷移制御用フラグ
     */
    pageJumpFlg: {
        // 撮影画面遷移制御
        CAMERA_FLG_CONTROL: {
            MOD_FLG: "MOD_FLG",
            MOD_ID_FLG: "MOD_ID_FLG",
            SKIP_MASK_FLG: "SKIP_MASK_FLG",
            SKIP_MASK_FLG2: "SKIP_MASK_FLG2" // 塗りつぶしスキップフラグ（2種類目）
        },
        // 入力画面遷移制御
        INPUT_FLG_CONTROL: {
            KYAKNM_F: "KYAKNM_F",
            KYAK_ADDR_F: "KYAK_ADDR_F",
            TELNO_F: "TELNO_F",
            NIKKO_MRF_F: "NIKKO_MRF_F",
            NIKKO_CARD_F: "NIKKO_CARD_F",
            NIKKO_EZ_F: "NIKKO_EZ_F",
            GAIK_SYKN_KOZA_F: "GAIK_SYKN_KOZA_F",
            TKTEI_KOZA_F: "TKTEI_KOZA_F",
            TKTEI_KANRI_KOZA_F: "TKTEI_KANRI_KOZA_F",
            KANYUSY_EXP_F: "KANYUSY_EXP_F",
            NISA_KOZA_F: "NISA_KOZA_F",
            MYNO_KOKUCHI_F: "MYNO_KOKUCHI_F",
            KOZA_DEL_F: [
                "KOZA_DEL_F",
                "KOZA_DEL_F",
                "KOZA_DEL_F",
                "KOZA_DEL_F",
                "KOZA_DEL_F",
                "KOZA_DEL_F",
                "KOZA_DEL_F",
                "KOZA_DEL_F",
                "KOZA_DEL_F"
            ],
            BK_KOZA_ADD_F: "BK_KOZA_ADD_F",
            YUCH_KOZA_ADD_F: "YUCH_KOZA_ADD_F",
            SUKN_HKT_F: "SUKN_HKT_F",
            SUKN_HKT_MEIG_F: "SUKN_HKT_MEIG_F",
            GAIK_SYKN_YEN_F: "GAIK_SYKN_YEN_F",
            RUITOU_SUKN_KAIT_TEIS_F: "RUITOU_SUKN_KAIT_TEIS_F",
            HAITKN_SYKN_UKTR_F: "HAITKN_SYKN_UKTR_F" // 配当金受領方式変更フラグ
        }
    },
    /**
     * CD-009:画面遷移ルーティング情報
     */
    pageJumpRoutingJoho: {
        ROUTING_INFO: "ROUTING_INFO" // 画面遷移ルーティング情報
    },
    /**
     * CD-010:申込データ（特定個人情報）
     */
    offerMynumberData: {
        MYNO: "MYNO" // 個人番号
    },
    /**
     * CD-011:マスタ情報
     */
    masterJoho: {
        KBN: "KBN",
        CD: "CD",
        MSY: "MSY",
        STM1: "STM1",
        STM2: "STM2",
        STM3: "STM3",
        STM4: "STM4",
        STM5: "STM5",
        STM6: "STM6",
        DEL_FLG: "DEL_FLG",
        SORT_KEY: "SORT_KEY" // ソートキー
    },
    /**
     * CD-101:申込データ（電子帳票）
     */
    offerMailData: {
        // 営業員情報
        EIGYOIN_JOHO: {
            PROPER_C: "PROPER_C",
            UKETSUKE_MISE_C: "UKETSUKE_MISE_C",
            UKETSUKE_KAKARI_C: "UKETSUKE_KAKARI_C" // 受付者係コード
        },
        // お客さま情報
        KYAK_JOHO: {
            MISE_C: "MISE_C",
            KYAK_CIF_C: "KYAK_CIF_C" // 客コード
        },
        // 申し込み補足情報
        MOSKM_HSK: {
            MOSKM_NICHJ: "MOSKM_NICHJ",
            UUID: "UUID",
            IDO: "IDO",
            KEIDO: "KEIDO" // 経度
        },
        // 受付場所情報
        UKE_JOHO: {
            UKTKBASY_K: "UKTKBASY_K" // 受付場所区分
        },
        // 電子帳票
        CHOHYO: {
            CHOHYO_ID: "CHOHYO_ID",
            MAIL_ACCOUNT: "MAIL_ACCOUNT",
            MAIL_DOMAIN_FLAG: "MAIL_DOMAIN_FLAG",
            MAIL_DOMAIN: "MAIL_DOMAIN",
            MAIL_DOMAIN_C: "MAIL_DOMAIN_C" // メールアドレスドメインコード
        }
    }
});
