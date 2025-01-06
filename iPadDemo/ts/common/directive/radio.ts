App.directive('radio',['AppBizCom', '$timeout', (AppBizCom, $timeout) => {
    return {
        restrict: 'E',
        templateUrl:'pages/common/directive/radio.html',
        scope:{
            list: '=', // 該当項目のマスタデータ
            name: '@?', // グループname
            data: '=', // スコープ内該当項目の入力データ
            disabled: '=?', // 非活性制御用フラグ
            click: '&?', // クリック時のイベント
            change: '&?' // 選択変更時のイベント
        },
        link: (scope, elem, attrs) => {
            if (!(<any>attrs).disabled) {(<any>attrs).disabled = 'false'};
            
            // 値変更の時、エラーをクリアする
            scope.$watch('data', function(newVal, oldVal){
                return newVal !== oldVal && AppBizCom.Msg.clearError((<any>attrs).id);
            });

            (<any>scope).radioChg = function(){
                angular.isFunction((<any>scope).change) &&
                    $timeout(function() {(<any>scope).change({value: (<any>scope).data})});
            };

            (<any>scope).radioClick = function($event){
                angular.isFunction((<any>scope).click) &&
                    $timeout(function() {(<any>scope).click({$event: $event, value: (<any>scope).data})});
            }
        }
    };
}]);