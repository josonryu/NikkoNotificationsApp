declare var cordova: any;
declare var StatusBar: any;
declare var Connection: any;

var App = angular.module('App', ['ngRoute'])
    .config(function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'pages/G1030-01_splash.html',
                controller: 'splashController'
            })
            .when('/homeMenu', {
                templateUrl: 'pages/G1040-01_homeMenu.html',
                controller: 'homeMenuController'
            })
            .when('/selectPlace', {
                templateUrl: 'pages/G1050-01_selectPlace.html',
                controller: 'selectPlaceController'
            })
            .when('/selectCustomer', {
                templateUrl: 'pages/G1060-01_selectCustomer.html',
                controller: 'selectCustomerController'
            })
            .when('/resultCustomer', {
                templateUrl: 'pages/G1060-02_resultCustomer.html',
                controller: 'resultCustomerController'
            })
            .when('/inputOperationStart', {
                templateUrl: 'pages/G1070-01_inputOperationStart.html',
                controller: 'inputOperationStartController'
            })
            .when('/inputNotifications/:prev?/:scrollId?', {
                templateUrl: 'pages/G1080-01_inputNotifications.html',
                controller: 'inputNotificationsController'
            })
            .when('/selectIdentificationDescription/:prev?', {
                templateUrl: 'pages/G1090-01_selectIdentificationDescription.html',
                controller: 'selectIdentificationDescriptionController'
            })
            .when('/selectNecessaryDoc/:prev?', {
                templateUrl: 'pages/G1100-01_selectNecessaryDoc.html',
                controller: 'selectNecessaryDocController'
            })
            .when('/mynumberInput', {
                templateUrl: 'pages/G1110-01_mynumberInput.html',
                controller: 'mynumberInputController'
            })
            .when('/selectIdentificationDoc', {
                templateUrl: 'pages/G1140-01_selectIdentificationDoc.html',
                controller: 'selectIdentificationDocController'
            })
            .when('/cameraDescription', {
                templateUrl: 'pages/G1150-01_cameraDescription.html',
                controller: 'cameraDescriptionController'
            })
            .when('/cameraIdFrontResult', {
                templateUrl: 'pages/G1180-01_cameraIdFrontResult.html',
                controller: 'cameraIdFrontResultController'
            })
            .when('/cameraIdBackResult', {
                templateUrl: 'pages/G1180-02_cameraIdBackResult.html',
                controller: 'cameraIdBackResultController'
            })
            .when('/cameraIdThirdResult', {
                templateUrl: 'pages/G1180-03_cameraIdThirdResult.html',
                controller: 'cameraIdThirdResultController'
            })
			.when('/ocrIdResult', {
                templateUrl: 'pages/G1190-01_ocrIdResult.html',
                controller: 'ocrIdResultController'
            })
            .when('/ocrId2Result', {
                templateUrl: 'pages/G1190-02_ocrId2Result.html',
                controller: 'ocrId2ResultController'
            })
            .when('/cameraIdFill/:prev?', {
                templateUrl: 'pages/G1210-01_cameraIdFill.html',
                controller: 'cameraIdFillController'
            })
            .when('/applicationConfirmStart', {
                templateUrl: 'pages/G1220-01_applicationConfirmStart.html',
                controller: 'applicationConfirmStartController'
            })
            .when('/customerFinalInput/:prev?', {
                templateUrl: 'pages/G1230-01_customerFinalInput.html',
                controller: 'customerFinalInputController'
            })
            .when('/applicationConfirm', {
                templateUrl: 'pages/G1240-01_applicationConfirm.html',
                controller: 'applicationConfirmController'
            })
            .when('/finalConfirmDescription', {
                templateUrl: 'pages/G1250-01_finalConfirmDescription.html',
                controller: 'finalConfirmDescriptionController'
            })
            .when('/finalConfirm', {
                templateUrl: 'pages/G1260-01_finalConfirm.html',
                controller: 'finalConfirmController'
            })
            .when('/applicationComp', {
                templateUrl: 'pages/G1270-01_applicationComp.html',
                controller: 'applicationCompController'
            })
            .when('/applicationCompSendSuccess', {
                templateUrl: 'pages/G1270-02_applicationCompSendSuccess.html',
                controller: 'applicationCompSendSuccessController'
            })
            .when('/applicationCompSendFailed', {
                templateUrl: 'pages/G1270-03_applicationCompSendFailed.html',
                controller: 'applicationCompSendFailedController'
            })
            .when('/selectSignDoc', {
                templateUrl: 'pages/G1400-01_selectSignDoc.html',
                controller: 'selectSignDocController'
            })
            .when('/signDoc', {
                templateUrl: 'pages/G1410-01_signDoc.html',
                controller: 'signDocController'
            })
            .otherwise({
                redirectTo: '/homeMenu'
            })
});

// deviceready時にangularjs起動
angular.element(document).ready(function(){
    if ((<any>window).cordova) {
        document.addEventListener('deviceready', function () {
            angular.bootstrap(document.body, ['App']);
        }, false);
    } else {
        angular.bootstrap(document.body, ['App']);
    }
   
});

// 画面遷移時の共通処理
App.run(['$rootScope', 'AppBizDataHolder','timeOutCheck',
function ($rootScope, AppBizDataHolder, timeOutCheck){

    $rootScope.$on('$locationChangeStart',function(event, next, current){

        // アプリ起動時のパスを判別
        if (current != next) {

            var currentIndex = current.indexOf('!');
            var currentPath = current.substr(currentIndex+1);
            if (currentPath == "/") {
                // アプリ起動時間
                timeOutCheck.setTimeStartCounter(new Date());
            }
        }

    });

    $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
        // ルーティング情報退避
        setRouteInfo(current, previous);
        // 手書きのSystemキーボード対応をリセット
        resetScroll();
    });
    // ルーティング情報退避
    function setRouteInfo (current, previous) {
        if (previous) {
            var preUrl:string = previous.originalPath;
            var curUrl:string = current.originalPath;
            if (preUrl && curUrl) {
                var prevPath:string = getPath(preUrl);
                var curPath:string = getPath(curUrl);
                var prevPathInHoler:string = AppBizDataHolder.getPrevRoutePath();
                if (prevPathInHoler) {
                    if (prevPathInHoler == curPath) {
                        AppBizDataHolder.deleteRouteInfoByPath(prevPathInHoler);
                    }
                    else {
                        AppBizDataHolder.setPrevRoutePath(prevPath);
                    }
                }
                else {
                    AppBizDataHolder.setPrevRoutePath(prevPath);
                }
            }
        }
    }
    // URLからルーティング情報取得
    function getPath(url) {
        if (!url) {
            return '';
        }
        var array: any = url.split('/');
        if (array.length > 1) {
            return array[1];
        } else {
            return '';
        }
    }
    // スクロール状態復元(divスクロール⇒bodyスクロール)
    function resetScroll() {
        if (cordova) {
            cordova.plugins.Keyboard.disableScroll(false);
        }
        $('.scrollArea').removeClass('main-div-area-scroll');
        $('.modal-backdrop.fade.in').remove();
        $('body').removeClass('is-modal-open'); 
    }
}]);

// APPBIZ-0014エラー共通処理登録
new AppBizExceptionHandler(App);
