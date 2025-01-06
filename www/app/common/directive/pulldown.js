App.directive('pulldown', ['AppBizCom', '$timeout', (AppBizCom, $timeout) => {
        return {
            restrict: 'E',
            templateUrl: 'pages/common/directive/pulldown.html',
            scope: {
                labelProperty: '@',
                valueProperty: '@',
                data: '=',
                list: '=',
                placeholder: '@',
                disabled: '=',
                width: '@',
                change: '&',
                id: '@',
                idGroup: '@',
                groupIndex: '=?',
            },
            link: ($scope, el, attrs) => {
                if (!attrs.labelProperty) {
                    attrs.labelProperty = 'MSY';
                }
                ;
                if (!attrs.valueProperty) {
                    attrs.valueProperty = 'CD';
                }
                ;
                if (attrs.placeholder == undefined) {
                    attrs.placeholder = '選択する';
                }
                ;
                // グループ項目idがあれば、グループ内各項目のidを更新する（グループ項目id定義 + グループ項目のインデックス）
                if (attrs.idGroup && attrs.groupIndex) {
                    $scope.id = attrs.idGroup + $scope.groupIndex;
                }
                ;
                $scope.defaultLabel = attrs.placeholder;
                $scope.label = $scope.defaultLabel;
                $scope.isSelected = false;
                $scope.selectChange = ($event, e) => {
                    $scope.data = e[$scope.valueProperty];
                    angular.isFunction($scope.change) && $timeout(function () { $scope.change.apply(null, { value: $scope.data, $event: $event }); });
                };
                $scope.$watch('disabled', (val) => {
                    if (val) {
                        $scope.data = undefined;
                    }
                });
                $scope.$watch('data', (val) => {
                    if (val && $scope.list) {
                        // 値変更の時、エラーをクリアする
                        AppBizCom.Msg.clearError(attrs.id);
                        AppBizCom.Msg.clearError($scope.id);
                        var selected = $scope.list.find((item) => item[$scope.valueProperty] == val);
                        if (selected) {
                            $scope.label = selected[$scope.labelProperty];
                            $scope.isSelected = true;
                        }
                        else {
                            $scope.label = $scope.defaultLabel;
                            $scope.isSelected = false;
                        }
                    }
                    else {
                        $scope.label = $scope.defaultLabel;
                        $scope.isSelected = false;
                    }
                });
            }
        };
    }]);
