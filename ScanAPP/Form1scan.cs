using System;
using System.Drawing;
using System.Windows.Forms;
using System.Diagnostics;
using System.Drawing.Imaging;
using System.IO;
using System.Xml;
using System.Xml.Serialization;
using Windows.Storage;
using PFU.DLCameraScan;
using PFU.DLCameraOcr;

namespace ScanAPP
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
            cameraScanInit();
        }
        string cameraPath;
        SettingsOperation operation;

        private void cameraScanInit()
        {
            cameraPath = Windows.Storage.ApplicationData.Current.LocalFolder.Path + @"\camera";
            if (!Directory.Exists(cameraPath))
            {
                Directory.CreateDirectory(cameraPath);
            }
            operation = new SettingsOperation(cameraPath);
            PDLCameraScan.Instance.LogCallbackBlocks = null;
            // PDLCameraOcr.Instance.LogCallbackBlocks = null;

            // ライブラリ初期化
            // SetOcrConfig();
            var scanError = PDLCameraScan.Instance.PrepareResource();
            // var scanError = PDLCameraOcr.Instance.PrepareResource();
            var errorCode = (int)scanError.Code;
            operation.Set("PrepareResourceCode", Convert.ToString(errorCode));
            if (scanError.Code == PDLCameraScanErrorCode.OK)
            // if (scanError.Code == PDLCameraOcrErrorCode.OK)
            {
                Debug.WriteLine("PrepareResource OK : " + errorCode);
                label2.Text = "PrepareResource OK : " + errorCode;
                button1.Enabled = true;

                button1_Click(null, null);


            }
            else
            {
                Debug.WriteLine("PrepareResource error : " + errorCode);
                label2.Text = "PrepareResource error : " + errorCode;
            }


        }

        private void button1_Click(object sender, EventArgs e)
        {


            // CancelCaptureOnce メソッドの呼び出し例のため、
            // 60秒後にキャンセルするタイマーをスタートします。
            System.Timers.Timer timer = new System.Timers.Timer(60000);
            timer.Elapsed += new System.Timers.ElapsedEventHandler(DoCancelCaptureOnce);
            timer.AutoReset = false;
            timer.Enabled = true;
            timer.Start();

            // カメラプレビュー開始
            // CaptureOnceはUIカスタマイズ機能を使用しない場合に用いるメソッドです。
            // UIカスタマイズ機能を使用する場合、CaptureOnce2メソッドをご利用ください。
            PDLDocInfo docInfo;
            // PDLCardInfo docInfo;
            operation.Set("CameraScreenStatus", "0");
            var scanError = PDLCameraScan.Instance.CaptureOnce2(this, new CustomizeForm("運転免許証（表面）", "1"), out docInfo);
            // var scanError = PDLCameraOcr.Instance.CaptureOnce2(this, new CustomizeForm("運転免許証（表面）", "1"), out docInfo);
            // 上でスタートしたタイマーをストップします。
            timer.Stop();
            timer.Dispose();
            operation.Set("CameraScanErrorCode", Convert.ToString((int)scanError.Code));
            switch (scanError.Code)
            {
                case PDLCameraScanErrorCode.OK:
                // case PDLCameraOcrErrorCode.OK:
                    this.OutputScanResult(docInfo);
                    break;
                case PDLCameraScanErrorCode.CropFailed:
                // case PDLCameraOcrErrorCode.CamOcrInternal:
                    this.OutputScanResult(docInfo);
                    Debug.WriteLine("Crop failed");
                    this.label2.Text = "Crop failed";
                    break;
                case PDLCameraScanErrorCode.Cancel:
                // case PDLCameraOcrErrorCode.Cancel:
                    Debug.WriteLine("Cancel preview");
                    this.label2.Text = "Cancel preview";
                    break;
                default:
                    Debug.WriteLine("Preview failed : " + (int)scanError.Code);
                    var text = String.Format("Error code is returned:{0}", (int)scanError.Code);

                    this.label2.Text = text;
                    break;
            }
            operation.Set("CameraScreenStatus", "1");
            PDLCameraScan.Instance.DeinitResource();
            // PDLCameraOcr.Instance.DeinitResource();
            Environment.Exit(0);
        }

        private void OutputScanResult(PDLDocInfo docInfo)
        // private void OutputScanResult(PDLCardInfo docInfo)
        {

            // 画像イメージを出力する
            using (Bitmap bImage = docInfo.Image)
            {
                if (bImage != null)
                {
                    // イメージを設定
                    // this.pictureBox.Image = docInfo.Image;
                    // JPEG用エンコーダの取得
                    ImageCodecInfo jpgEncoder = null;
                    foreach (ImageCodecInfo ici in ImageCodecInfo.GetImageEncoders())
                    {
                        if (ici.FormatID == ImageFormat.Jpeg.Guid)
                        {
                            jpgEncoder = ici;
                            break;
                        }
                    }

                    // 品質レベル：35　を設定(Settingsより取得)
                    EncoderParameter encParam = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, 50L);
                    EncoderParameters encParams = new EncoderParameters(1);
                    encParams.Param[0] = encParam;

                    MemoryStream ms = new MemoryStream();

                    // 撮影画像をJPEG(品質35)にてMemoryStreamに格納
                    bImage.Save(ms, jpgEncoder, encParams);

                    // BASE64化して格納
                    byte[] byteImage = ms.ToArray();
                    if (byteImage.Length > 0)
                    {
                        var SigBase64 = Convert.ToBase64String(byteImage);
                        if (SigBase64.Length > 0)
                        {
                            File.WriteAllText(cameraPath + @"\imagebase64.txt", SigBase64);
                            operation.Set("ScanPhotoMode", ((int)docInfo.Mode).ToString());
                            operation.Set("ImageFileExists", "0");
                            label2.Text = @"Base64保存成功";
                            label3.Text = @"Base64 :" + SigBase64;
                        }
                        else
                        {
                            label3.Text = @"Base64変換失敗";
                        }
                    }
                }
                else
                {
                    label2.Text = @"image not found";
                }
            }
        }

        /// <summary>
        ///　カメラOCRライブラリ設定更新（OCRモード）
        /// </summary>
        private void SetOcrConfig()
        {
            var config = PDLCameraOcr.Instance.GetConfig();

            // 認識処理に関する設定情報 ---------------------------------------

            // 運転免許証の住所が都道府県を省略している場合に、都道府県を補完する機能の有効状態
            // 郵便番号検索を行う場合は true　が必須条件
            // config.RecognitionParam.NeedsPrefectures = Properties.Settings.Default.NeedsPrefectures;
            // 撮影非対象の本人確認書類が撮影されたときにエラーコードを返すかどうか
            // config.RecognitionParam.IsCardTypeErrorEnabled = Properties.Settings.Default.IsCardTypeErrorEnabled;
            // 運転免許証表面に光が反射していても認識を開始するかどうか
            // config.RecognitionParam.CheckLight = Properties.Settings.Default.CheckLight;

            // 運転免許証（表面）
            // config.RecognitionParam.IsOcrDriversLicenseEnabled = Properties.Settings.Default.IsOcrDriversLicenseEnabled;
            // 運転免許証（表面）
            // config.RecognitionParam.IsOcrDriversLicenseBackEnabled = Properties.Settings.Default.IsOcrDriversLicenseBackEnabled;
            // 通知カード
            // config.RecognitionParam.IsOcrNotificationEnabled = Properties.Settings.Default.IsOcrNotificationEnabled;
            // マイナンバーカード（表面）
            // config.RecognitionParam.IsOcrMyNumberFrontEnabled = Properties.Settings.Default.IsOcrMyNumberFrontEnabled;
            // マイナンバーカード（裏面）
            // config.RecognitionParam.IsOcrMyNumberBackEnabled = Properties.Settings.Default.IsOcrMyNumberBackEnabled;
            // 在留カード
            // config.RecognitionParam.IsOcrResidenceCardEnabled = Properties.Settings.Default.IsOcrResidenceCardEnabled;
            // 特別永住者証明書
            // config.RecognitionParam.IsOcrSpecialPermanentEnabled = Properties.Settings.Default.IsOcrSpecialPermanentEnabled;

            // 撮影ガイドの設定情報 ------------------------------------------------------------

            // 撮影ガイドの可視状態
            config.GuideParam.Visible = true;

            // 認識領域の設定情報 ---------------------------------------------------------------

            // 認識領域の可視状態
            config.CroppingRegionParam.Visible = true;
            // ----------------------------------------------------------------------------------

            // ライブラリの再設定
            PDLCameraOcr.Instance.SetConfig(config);

        }

        public void DoCancelCaptureOnce(object source, System.Timers.ElapsedEventArgs e)
        {
            CancelPrevew();
        }
        public void CancelPrevew()
        {
            PDLCameraScan.Instance.CancelCaptureOnce();
            // PDLCameraOcr.Instance.CancelCaptureOnce();
        }

        private void label3_Click(object sender, EventArgs e)
        {

        }
    }

    public class SettingsOperation
    {
        string filePath;
        Settings settings;

        public SettingsOperation(string cameraPath)
        {
            filePath = cameraPath + @"\settings.xml";
            settings = new Settings()
            {
                PrepareResourceCode = "",
                CameraScreenStatus = "",
                ScanPhotoMode = "",
                ImageFileExists = "",
                CameraScanErrorCode = ""
            };
            XmlSerializerUtil.Serialize(filePath, settings);
        }

        public void Set(string key, string value)
        {
            switch (key)
            {
                case "PrepareResourceCode":
                    settings.PrepareResourceCode = value;
                    break;
                case "CameraScreenStatus":
                    settings.CameraScreenStatus = value;
                    break;
                case "ScanPhotoMode":
                    settings.ScanPhotoMode = value;
                    break;
                case "ImageFileExists":
                    settings.ImageFileExists = value;
                    break;
                case "CameraScanErrorCode":
                    settings.CameraScanErrorCode = value;
                    break;
                default:
                    break;
            }
            XmlSerializerUtil.Serialize(filePath, settings);
        }

        [Serializable]
        public class Settings
        {
            // OK 0 正常終了
            // Cancel 1 ユーザー操作によるキャンセル
            // CropFailed 2 正常終了（撮影には成功したが、書類の切り出しに失敗）
            // Memory -2001 メモリ不足
            // DlScanUninitialized -6001 未初期化
            // CamScanUnknown 9000 内部エラー
            // CamScanInvalidArgument 9001 引数エラー
            // CamScanInternal 9002 内部エラー
            // CamScanBadSequence 9003 呼び出しシーケンスエラー
            // CamScanHardwareFailed 9100 ハードウェア処理エラー
            // CamScanNotReleased 9200 リソース解放エラー
            public string PrepareResourceCode { get; set; }
            // 0 ：visible, 1 ：invisible
            public string CameraScreenStatus { get; set; }
            // 1 ：自動モード, 2 ：手動モード, 3 ：タイマーモード
            public string ScanPhotoMode { get; set; }
            // 0 ：exists, 1 ：not exists
            public string ImageFileExists { get; set; }
            // PrepareResourceCodeと同様
            public string CameraScanErrorCode { get; set; }
        }
    }

    public class XmlSerializerUtil
    {
        public static void Serialize<T>(string filePath, T data)
        {
            try
            {
                XmlSerializer serializer = new XmlSerializer(typeof(T));
                using (StreamWriter writer = new StreamWriter(filePath))
                {
                    serializer.Serialize(writer, data);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception occur during XML Serialization :{ex.Message}");
            }
        }

        public static T Deserilaze<T>(string filePath)
        {
            try
            {
                XmlSerializer serializer = new XmlSerializer(typeof(T));
                using (StreamReader reader = new StreamReader(filePath))
                {
                    return (T)serializer.Deserialize(reader);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception occur during XML Deserialization :{ex.Message}");
            }
            return default(T);
        }
    }
}
