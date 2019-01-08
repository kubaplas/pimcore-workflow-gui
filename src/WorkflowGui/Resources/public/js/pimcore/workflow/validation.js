/**
 * Workflow GUI Pimcore Plugin
 *
 * LICENSE
 *
 * This source file is subject to the GNU General Public License version 3 (GPLv3)
 * For the full copyright and license information, please view the LICENSE.md and gpl-3.0.txt
 * files that are distributed with this source code.
 *
 * @copyright  Copyright (c) 2015-2018 Dominik Pfaffenbauer (https://www.pfaffenbauer.at)
 * @license    https://github.com/dpfaffenbauer/pimcore-WorkflowGui/blob/master/LICENSE.md     GNU General Public License version 3 (GPLv3)
 */

pimcore.registerNS("pimcore.plugin.workflow.validation");
pimcore.plugin.workflow.validation = Class.create({

    initialize : function () {
        this.show();
    },

    getWindow: function () {

        if (!this.window) {
            this.window = new Ext.window.Window({
                width: 800,
                height: 700,
                modal: true,
                resizeable: true,
                layout: 'fit',
                title: t('workflow_validation_rules'),
                items: [
                    {
                        xtype: 'panel',
                        border: false,
                        layout: 'border',
                        items: [
                            this.getValidationPanel()
                        ]
                    }
                ]
            });
        }

        return this.window;
    },


    getValidationPanel: function () {
        var classId = 6;

        if (!this.validationPanel) {
            this.validationPanel = Ext.create('Ext.panel.Panel', {
                region: 'center',
                layout: 'fit'
            });
            this.getValidationPanel().removeAll(true);
            this.getValidationPanel().setLoading(true);
            Ext.Ajax.request({
                url: '/admin/class/get',
                params: {
                    id: classId
                },
                success: this.addValidationRulesPanel.bind(this, classId)
            });
        }

        return this.validationPanel;
    },

    addValidationRulesPanel: function (classId, response) {
        var data = Ext.decode(response.responseText);

        var validationRulesPanel = Ext.create('Ext.tree.Panel', {
            id: 'workflow_validation_rules_panel_' + classId,
            autoScroll: true,
            root: {
                id: "0",
                root: true,
                text: t("base"),
                leaf: true,
                iconCls: "pimcore_icon_class",
                isTarget: true
            },
            listeners: {
                checkchange: function (node, checked, eOpts) {
                    this.save(classId, validationRulesPanel.getChecked());
                }.bind(this)
            }
        });

        this.getValidationPanel().setLoading(false);
        this.getValidationPanel().add(validationRulesPanel);

        if (data.layoutDefinitions) {
            if (data.layoutDefinitions.childs) {
                for (var i = 0; i < data.layoutDefinitions.childs.length; i++) {
                    validationRulesPanel.getRootNode().appendChild(
                        this.recursiveAddNode(
                            data.layoutDefinitions.childs[i],
                            this.getChecked(classId),
                            validationRulesPanel.getRootNode()
                        )
                    );
                }
                validationRulesPanel.getRootNode().expand();
            }
        }
    },

    recursiveAddNode: function (con, checked, scope) {
        var fn = null;
        var newNode = null;

        if (con.datatype == "layout") {
            fn = this.addLayoutChild.bind(scope, con.fieldtype, con);
        } else if (con.datatype == "data") {
            fn = this.addDataChild.bind(scope, con.fieldtype, con, checked);
        }

        newNode = fn();

        if (con.childs) {
            for (var i = 0; i < con.childs.length; i++) {
                this.recursiveAddNode(con.childs[i], checked, newNode);
            }
        }

        return newNode;
    },

    addLayoutChild: function (type, initData) {

        var nodeLabel = t(type);

        if (initData) {
            if (initData.name) {
                nodeLabel = initData.name;
            }
        }

        var newNode = {
            text: nodeLabel,
            value: nodeLabel,
            type: "layout",
            iconCls: "pimcore_icon_" + type,
            leaf: false,
            expandable: false,
            expanded: true
        };

        newNode = this.appendChild(newNode);

        //to hide or show the expanding icon depending if childs are available or not
        newNode.addListener('remove', function (node, removedNode, isMove) {
            if (!node.hasChildNodes()) {
                node.set('expandable', false);
            }
        });

        newNode.addListener('append', function (node) {
            node.set('expandable', true);
        });

        this.expand();

        return newNode;
    },

    addDataChild: function (type, initData, checked) {

        var nodeLabel = t(type);

        if (initData) {
            if (initData.name) {
                nodeLabel = initData.name;
            }
        }

        var prefix = '';
        if (!this.data.root && this.data.type == 'data') {
            prefix = this.data.value + '.';
        }

        var newNode = {
            text: nodeLabel,
            value: prefix + nodeLabel,
            type: "data",
            leaf: true,
            iconCls: "pimcore_icon_" + type
        };

        if (type === "block" || type == "localizedfields") {
            newNode.leaf = false;
            newNode.expanded = true;
            newNode.expandable = false;
        } else {
            newNode.checked = false;
        }

        if (checked.includes(newNode.value)) {
            newNode.checked = true;
        }

        newNode = this.appendChild(newNode);

        this.expand();

        return newNode;
    },

    getChecked: function (classId) {
        var validation = this.validation;
        if (!validation) {
            return [];
        }
        for (var i = 0; i < validation.length; i++) {
            if (validation[i].classId == classId) {
                return validation[i].rules;
            }
        }
        return [];
    },

    save: function (classId, checked) {
        var rules = [];
        for (var i = 0; i < checked.length; i++) {
            rules.push(checked[i].get('value'));
        }

        var validation = this.record.get('validation');
        for (var i = 0; i < validation.length; i++) {
            if (validation[i].classId == classId) {
                validation[i].rules = rules;
                console.log(validation);
                break;
            }
        }
    },

    show: function () {
        this.getWindow().show();
    },

    getObjectTypesStore: function () {

        if (!this.objectTypeStore) {
            this.objectTypeStore = pimcore.globalmanager.get("object_types_store");
        }

        return this.objectTypeStore;
    }
});