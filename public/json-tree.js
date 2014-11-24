(function(){

    'use strict';

    angular.module('json-tree', [])
        .constant('jsonTreeConfig', {
            //templateUrl : 'template.html'
            templateUrl : ''
        })

        .directive('jsonTree', ['$compile', '$q', '$http', '$templateCache', 'jsonTreeConfig',  function($compile, $q, $http, $templateCache, jsonTreeConfig) {

            var template =
                '<span ng-bind="utils.wrap.start(node)"></span>' +
                '<span ng-bind="node.isCollapsed ? utils.wrap.middle(node) : \'&nbsp;&nbsp;&nbsp;\'" ng-click="utils.clickNode(node)"></span>' +
                '<ul ng-hide="node.isCollapsed">' +
                    '<i class="icon-caret-down"></i>' +
                    '<li ng-repeat="key in utils.keys(json) track by key">' +
                            '<span  class="key" ng-click="utils.clickNode(childs[key])" >{{ key }} </span>' +
                            '<span ng-hide="childs[key].isObject()">' +
                                '<input ng-show="childs[key].type() === \'boolean\'" type="checkbox" ng-model="json[key]"/>' +
                                '<input ng-show="childs[key].type() === \'number\'" type="number" ng-model="json[key]"/>' +
                                '<input ng-show="childs[key].type() !== \'number\'" type="text" ng-model="json[key]" ng-change="utils.validateNode(key)" placeholder="null"/>' +
                            '</span>' +
                            '<json-tree json="json[key]" collapsed-level="{{+collapsedLevel - 1}}" node="childs[key]" ng-show="childs[key].isObject()"></json-tree>' +
                    '</li>' +
                '</ul>' +
                '<span ng-bind="utils.wrap.end(node)"></span>';
            function getTemplatePromise() {
                if(jsonTreeConfig.templateUrl) return $http.get(jsonTreeConfig.templateUrl, {
                    cache: $templateCache
                }).then(function (result) {
                    return result.data;
                });

                return $q.when(template);
            }

            return {
                restrict: 'EA',
                scope: {
                    json: '=',
                    node: '=?',
                    childs: '=?',
                    collapsedLevel: '@'
                },
                controller: function($scope){

                    /* initialize container for child nodes */
                    $scope.childs = {};

                    /* define auxiliary functions */
                    $scope.utils = {

                        /* prettify json view */
                        wrap: {
                            start: function(node){
                                if (node === undefined || node === null) return '';
                                switch (node.type()){
                                    case 'array': return '[]';
                                    case 'object': return '{}';
                                    default: return '';
                                };
                            },
                            middle: function(node){
                                if (node === undefined || node === null) return '';
                                switch (node.type()){
                                    case 'array': return '...';
                                    case 'object': return '...';
                                    default: return '';
                                };
                            },
                            end: function(node){
                                if (node === undefined || node === null) return '';
                                switch (node.type()){
                                    //case 'array': return ']';
                                    //case 'object': return '}';
                                    default: return '';
                                };
                            },
                            isLastIndex: function(node, index){
                                if (node === undefined || node === null) return true;
                                else return index >= node.length();
                            }
                        },

                        /* collapse/expand node by clicking */
                        clickNode: function(node){
                            node.isCollapsed = !node.isCollapsed;
                        },

                        /* reset node value by key to default == null */
                        resetNode: function(key){
                            $scope.json[key] = null;
                            $scope.refresh();
                        },

                        /* validate text if input to the form */
                        validateNode: function(key){
                            /* check if null */
                            if ($scope.json[key] === null);

                            /* check if undefined or "" */
                            else if ($scope.json[key] === undefined | $scope.json[key] === '') $scope.json[key] = null;

                            /* try to convert string to number */
                            else if (!isNaN(+$scope.json[key]) && isFinite($scope.json[key]))
                                $scope.json[key] = +$scope.json[key];

                            /* try to parse string to json */
                            else {
                                /* check if boolean input -> then refresh */
                                if ($scope.json[key] === "true" || $scope.json[key] === "false") {
                                    $scope.json[key] = JSON.parse($scope.json[key]);
                                    $scope.refresh();
                                }
                            }
                        },

                        /* to skip ordering in ng-repeat */
                        keys: function(obj){
                            return (obj instanceof Object) ? Object.keys(obj) : [];
                        },

                        /* get type for variable val */
                        getType: function(val){
                            if (val === null) return 'null'
                            else if (val === undefined) return 'undefined'
                            else if (val.constructor === Array) return 'array'
                            else if (val.constructor === Object) return 'object'
                            else if (val.constructor === String) return 'string'
                            else if (val.constructor === Number) return 'number'
                            else if (val.constructor === Boolean) return 'boolean'
                            else if (val.constructor === Function) return 'function'
                            else return 'object'
                        }
                    };

                    /* define properties of the current node */
                    $scope.node = {

                        /* check node is collapsed */
                        isCollapsed: ($scope.collapsedLevel && +$scope.collapsedLevel) ? (+$scope.collapsedLevel <= 0) : true, /* set up isCollapsed properties, by default - true */

                        /* if childs[key] is dragging now, dragChildKey matches to key  */
                        dragChildKey: null,

                        /* used to get info such as coordinates (top, left, height, width, meanY) of draggable elements by key */
                        dragElements: {},

                        /* check current node is object or array */
                        isObject: function(){
                            return angular.isObject($scope.json)
                        },

                        /* get type for current node */
                        type: function(){
                            return $scope.utils.getType($scope.json);
                        },

                        /* calculate collection length for object or array */
                        length: function(){
                            return ($scope.json instanceof Object) ? (Object.keys($scope.json).length) : 1
                        },

                        /* refresh template view */
                        refresh: function(){
                            $scope.refresh();
                        }
                    };
                },
                link: function(scope, element, attrs){

                    /* define child scope and template */
                    var childScope = scope.$new(),
                        templatePromise = getTemplatePromise()

                    /* define build template function */
                    scope.build = function(_scope){
                        if (scope.node.isObject()){
                            templatePromise.then(function(tpl) {
                                element.html('').append($compile(tpl)(_scope));
                            });
                        }
                    };

                    /* define refresh function */
                    scope.refresh = function(){
                        childScope.$destroy();
                        childScope = scope.$new();
                        scope.build(childScope);
                    };

                    /* build template view */
                    scope.build(childScope);
                }
            }
        }])
})()