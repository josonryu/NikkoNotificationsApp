using Windows;
using System.Windows.Forms;
using System;
using System.Runtime.InteropServices;


namespace ScanAPP
{

    partial class Form1
    {
        [DllImport("user32.dll", SetLastError = true)]
        private static extern bool SetWindowPos(
               IntPtr hWnd,         
               IntPtr hWndInsertAfter, 
               int X,              
               int Y,             
               int cx,              
               int cy,             
               uint uFlags        
           );

        private static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);
        private const uint SWP_NOSIZE = 0x0001;
        private const uint SWP_NOMOVE = 0x0002;
        private const uint SWP_NOACTIVATE = 0x0010;

        [DllImport("user32.dll", EntryPoint = "#2507")]
        extern static bool SetAutoRotation(bool bEnable);

        /// <summary>
        /// 必要なデザイナー変数です。
        /// </summary>
        private System.ComponentModel.IContainer components = null;


        /// <summary>
        /// 使用中のリソースをすべてクリーンアップします。
        /// </summary>
        /// <param name="disposing">マネージド リソースを破棄する場合は true を指定し、その他の場合は false を指定します。</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }

     
            base.Dispose(disposing);

          
        }

        #region Windows フォーム デザイナーで生成されたコード

        private void MakeTopMost()
        {
            bool result = SetWindowPos(this.Handle, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
            if (!result)
            {
                // エラーが発生した場合、エラーコードを取得
                int errorCode = Marshal.GetLastWin32Error();
                MessageBox.Show($"エラーコード: {errorCode}");
            }
        }


        /// <summary>
        /// デザイナー サポートに必要なメソッドです。このメソッドの内容を
        /// コード エディターで変更しないでください。
        /// </summary>
        private void InitializeComponent()
        {
        

            this.WindowState = System.Windows.Forms.FormWindowState.Normal;
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.None;
            this.Bounds = System.Windows.Forms.Screen.PrimaryScreen.Bounds;

            this.label1 = new System.Windows.Forms.Label();
            this.label2 = new System.Windows.Forms.Label();
            this.button1 = new System.Windows.Forms.Button();
            this.label3 = new System.Windows.Forms.Label();
            this.SuspendLayout();
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(300, 29);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(129, 15);
            this.label1.TabIndex = 0;
            this.label1.Text = "カメラ撮影検討アプリ";
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(28, 84);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(45, 15);
            this.label2.TabIndex = 1;
            this.label2.Text = "状態：";
            // 
            // button1
            // 
            this.button1.Enabled = false;
            this.button1.Location = new System.Drawing.Point(292, 130);
            this.button1.Name = "button1";
            this.button1.Size = new System.Drawing.Size(152, 51);
            this.button1.TabIndex = 2;
            this.button1.Text = "カメラ撮影起動";
            this.button1.UseVisualStyleBackColor = true;
            this.button1.Click += new System.EventHandler(this.button1_Click);
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Location = new System.Drawing.Point(31, 293);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(2000, 5000);
            this.label3.TabIndex = 3;
            this.label3.Text = "結果：";
            this.label3.Click += new System.EventHandler(this.label3_Click);
            // 
            // Form1
            // 
            //this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 15F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = this.Bounds.Size;
            this.Controls.Add(this.label3);
            this.Controls.Add(this.button1);
            this.Controls.Add(this.label2);
            this.Controls.Add(this.label1);
            this.Name = "Form1";
            this.Text = "Form1";
            this.ResumeLayout(false);
            this.PerformLayout();


            this.FormBorderStyle = FormBorderStyle.FixedSingle; // サイズ変更不可
            this.MaximizeBox = false; // 最大化ボタンを無効にする
            this.MinimizeBox = false; // 最小化ボタンを無効にする
            this.ControlBox = false; // コントロールボックス全体を無効にする
            this.TopMost = true; // フォームを最前面に表示

            this.MakeTopMost();

        }

      

        #endregion

        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.Button button1;
        private System.Windows.Forms.Label label3;
    }
}

