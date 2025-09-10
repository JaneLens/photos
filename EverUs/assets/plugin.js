document.addEventListener('DOMContentLoaded', function() {
        layui.use(['form', 'table', 'layer', 'jquery'], function () {
            const form = layui.form;
            const table = layui.table;
            const layer = layui.layer;
            const $ = layui.jquery;
            
            // 初始化标签页
            $('.tab-btn').on('click', function() {
                const tabId = $(this).data('tab');
                $('.tab-btn').removeClass('active');
                $(this).addClass('active');
                $('.tab-content').removeClass('active');
                $(`#${tabId}-tab`).addClass('active');
            });
            
            // 初始化两个系统
            initFriendSystem();
            initTaskSystem();
            
            function initFriendSystem() {
                let friendData = [];
                let friendTableIns = null;
                let currentEditId = null;
                
                // 核心工具函数
                function ensureFriendField() {
                    let field = document.querySelector('textarea[name="friend"]');
                    if (!field) {
                        field = document.createElement('textarea');
                        field.name = 'friend';
                        field.style.display = 'none';
                        document.body.appendChild(field);
                    }
                    return field;
                }
                
                function loadFriendData() {
                    try {
                        const field = ensureFriendField();
                        if (!field.value) {
                            friendData = [];
                            updateFriendCount();
                            return;
                        }
                        
                        friendData = field.value.split('\n')
                            .filter(line => line.trim())
                            .map((line, idx) => {
                                const parts = line.split('||').map(p => p.trim());
                                return {
                                    id: idx + 1,
                                    title: parts[0] || '',
                                    link: parts[1] || '',
                                    avatar: parts[2] || '',
                                    description: parts[3] || '',
                                    notes: parts[4] || ''
                                };
                            });
                        
                        updateFriendCount();
                    } catch (e) {
                        console.error('加载友链数据失败:', e);
                        layer.msg('友链数据加载失败', {icon: 2});
                    }
                }
                
                function saveFriendData() {
                    try {
                        const field = ensureFriendField();
                        const dataStr = friendData.map(friend => 
                            `${friend.title}||${friend.link}||${friend.avatar}||${friend.description}||${friend.notes}`
                        ).join('\n');
                        
                        field.value = dataStr;
                        return true;
                    } catch (e) {
                        console.error('保存友链数据失败:', e);
                        layer.msg('友链数据保存失败', {icon: 2});
                        return false;
                    }
                }
                
                function updateFriendCount() {
                    const total = friendData.length;
                    $('#friend-total-count').text(total);
                }
                
                // 表格初始化
                function initFriendTable() {
                    loadFriendData();
                    let tableHeight = window.innerHeight < 600 ? window.innerHeight - 300 : 400;
                    
                    if (friendTableIns) {
                        friendTableIns.reload({ data: friendData, height: tableHeight });
                    } else {
                        friendTableIns = table.render({
                            elem: '#friend-table',
                            height: tableHeight,
                            data: friendData,
                            page: false,
                            toolbar: '#friend-toolbar', // 添加工具栏
                            cols: [[
                                // 去掉了ID列
                                {field: 'avatar', title: '头像', width: 70, templet: '#avatar-tpl', align: 'center'},
                                {field: 'title', title: '标题', width: 120, align: 'center'},
                                {field: 'description', title: '描述', minWidth: 100, align: 'left'},
                                {field: 'link', title: '链接', width: 100, templet: '#link-tpl', align: 'center'},
                                {field: 'notes', title: '备注', minWidth: 100, align: 'left'},
                                {title: '操作', width: 180, toolbar: '#friend-action-tpl', align: 'center', fixed: 'right'}
                            ]],
                            done: function() {
                                updateFriendCount();
                            }
                        });
                    }
                }
                
                // 询问框风格表单弹窗
                function openFriendDialog(isEdit = false, friend = null) {
                    currentEditId = isEdit ? friend.id : null;
                    const formContent = document.getElementById('friend-form-tpl').innerHTML;
                    
                    layer.confirm(formContent, {
                        title: isEdit ? '编辑友链' : '新增友链',
                        area: window.innerWidth < 768 ? ['92%', 'auto'] : ['500px', 'auto'],
                        btn: ['确认', '取消'],
                        btnAlign: 'c',
                        skin: 'layui-layer-lan',
                        success: function(layero) {
                            form.render(null, 'friend-form');
                            
                            if (isEdit && friend) {
                                setTimeout(() => {
                                    form.val('friend-form', {
                                        id: friend.id.toString(),
                                        title: friend.title,
                                        link: friend.link,
                                        avatar: friend.avatar,
                                        description: friend.description,
                                        notes: friend.notes
                                    });
                                }, 50);
                            }
                            
                            if (window.innerWidth < 768) {
                                layero.find('.layui-form-label').css({width: '60px', 'font-size': '12px'});
                                layero.find('.layui-input-block').css('margin-left', '70px');
                                layero.find('.layui-input').css({'font-size': '12px', 'height': '32px'});
                            }
                        }
                    }, 
                    function(index) {
                        const formData = form.val('friend-form');
                        
                        if (!formData.title.trim()) {
                            layer.tips('标题不能为空', layero.find('input[name="title"]'), {tips: 1});
                            return false;
                        }
                        if (!formData.link.trim()) {
                            layer.tips('链接不能为空', layero.find('input[name="link"]'), {tips: 1});
                            return false;
                        }
                        if (!formData.avatar.trim()) {
                            layer.tips('头像不能为空', layero.find('input[name="avatar"]'), {tips: 1});
                            return false;
                        }
                        
                        formData.id = formData.id ? parseInt(formData.id) : null;
                        
                        if (!isEdit) {
                            const maxId = friendData.length ? Math.max(...friendData.map(f => f.id)) : 0;
                            formData.id = maxId + 1;
                            friendData.push(formData);
                        } else {
                            const friendIdx = friendData.findIndex(f => f.id === currentEditId);
                            if (friendIdx !== -1) friendData[friendIdx] = formData;
                        }
                        
                        if (saveFriendData()) {
                            initFriendTable();
                            layer.msg(isEdit ? '编辑成功' : '新增成功', {icon: 1, time: 1000});
                        }
                        
                        layer.close(index);
                    }, 
                    function(index) {
                        layer.close(index);
                    });
                }
                
                // 事件监听
                table.on('tool(friend-table)', function(obj) {
                    const data = obj.data;
                    const idx = friendData.findIndex(f => f.id === data.id);
                    
                    switch(obj.event) {
                        case 'edit':
                            openFriendDialog(true, data);
                            break;
                        case 'visit':
                            window.open(data.link, '_blank');
                            break;
                        case 'delete':
                            layer.confirm('确定删除这条友链吗？', {
                                title: '删除确认',
                                btn: ['确认删除', '取消'],
                                btnAlign: 'c'
                            }, function(confirmIndex) {
                                friendData.splice(idx, 1);
                                if (saveFriendData()) {
                                    initFriendTable();
                                    layer.msg('删除成功', {icon: 1, time: 800});
                                }
                                layer.close(confirmIndex);
                            });
                            break;
                    }
                });
                
                // 工具栏事件监听
                table.on('toolbar(friend-table)', function(obj){
                    switch(obj.event){
                        case 'add':
                            openFriendDialog(false);
                            break;
                        case 'filter':
                            layer.msg('筛选功能已开启', {icon: 1});
                            break;
                        case 'export':
                            layer.msg('导出功能已开启', {icon: 1});
                            break;
                        case 'print':
                            layer.msg('打印功能已开启', {icon: 1});
                            break;
                        case 'tips':
                            layer.alert('友链管理使用提示：<br>' +
                                '1. 点击"新增"按钮添加友链<br>' +
                                '2. 点击"访问"按钮可以查看友链网站<br>' +
                                '3. 点击"编辑"按钮可以修改友链信息<br>' +
                                '4. 点击"删除"按钮可以删除友链', {
                                title: '使用提示',
                                area: ['400px', 'auto'],
                                icon: 0
                            });
                            break;
                    }
                });
                
                // 新增按钮事件
                $('#friend-add-btn').on('click', function() {
                    openFriendDialog(false);
                });
                
                // 初始化
                initFriendTable();
            }
            
            function initTaskSystem() {
                let taskData = [];
                let taskTableIns = null;
                let currentEditId = null;
                
                // 核心工具函数
                function ensureCompassField() {
                    let field = document.querySelector('textarea[name="compass"]');
                    if (!field) {
                        field = document.createElement('textarea');
                        field.name = 'compass';
                        field.style.display = 'none';
                        document.body.appendChild(field);
                    }
                    return field;
                }
                
                function loadTaskData() {
                    try {
                        const field = ensureCompassField();
                        if (!field.value) {
                            taskData = [];
                            updateTaskCount();
                            return;
                        }
                        
                        taskData = field.value.split('\n')
                            .filter(line => line.trim())
                            .map((line, idx) => {
                                const parts = line.split('||').map(p => p.trim());
                                return {
                                    id: idx + 1,
                                    timeline: parts[0] || '',
                                    title: parts[1] || '',
                                    description: parts[2] || '',
                                    proof: parts[3] || '',
                                    status: parts[4] ? parseInt(parts[4]) : 0
                                };
                            });
                        
                        updateTaskCount();
                    } catch (e) {
                        console.error('加载任务数据失败:', e);
                        layer.msg('任务数据加载失败', {icon: 2});
                    }
                }
                
                function saveTaskData() {
                    try {
                        const field = ensureCompassField();
                        const dataStr = taskData.map(task => 
                            `${task.timeline}||${task.title}||${task.description}||${task.proof}||${task.status}`
                        ).join('\n');
                        
                        field.value = dataStr;
                        return true;
                    } catch (e) {
                        console.error('保存任务数据失败:', e);
                        layer.msg('任务数据保存失败', {icon: 2});
                        return false;
                    }
                }
                
                function updateTaskCount() {
                    const total = taskData.length;
                    const completed = taskData.filter(t => t.status === 1).length;
                    const uncompleted = total - completed;
                    
                    $('#task-total-count').text(total);
                    $('#task-completed-count').text(completed);
                    $('#task-uncompleted-count').text(uncompleted);
                }
                
                // 表格初始化
                function initTaskTable() {
                    loadTaskData();
                    let tableHeight = window.innerHeight < 600 ? window.innerHeight - 300 : 400;
                    
                    if (taskTableIns) {
                        taskTableIns.reload({ data: taskData, height: tableHeight });
                    } else {
                        taskTableIns = table.render({
                            elem: '#task-table',
                            height: tableHeight,
                            data: taskData,
                            page: false,
                            toolbar: '#task-toolbar', // 添加工具栏
                            cols: [[
                                // 去掉了ID列
                                {field: 'timeline', title: '时间线', width: 120, align: 'center'},
                                {field: 'title', title: '标题', width: 150, align: 'center'},
                                {field: 'description', title: '描述', minWidth: 100, align: 'left'},
                                {field: 'proof', title: '证明', minWidth: 100, align: 'left'},
                                {field: 'status', title: '状态', width: 100, templet: '#status-tpl', align: 'center'},
                                {title: '操作', width: 180, toolbar: '#task-action-tpl', align: 'center', fixed: 'right'}
                            ]],
                            done: function() {
                                updateTaskCount();
                            }
                        });
                    }
                }
                
                // 询问框风格表单弹窗
                function openTaskDialog(isEdit = false, task = null) {
                    currentEditId = isEdit ? task.id : null;
                    const formContent = document.getElementById('task-form-tpl').innerHTML;
                    
                    layer.confirm(formContent, {
                        title: isEdit ? '编辑任务' : '新增任务',
                        area: window.innerWidth < 768 ? ['92%', 'auto'] : ['500px', 'auto'],
                        btn: ['确认', '取消'],
                        btnAlign: 'c',
                        skin: 'layui-layer-lan',
                        success: function(layero) {
                            form.render(null, 'task-form');
                            
                            if (isEdit && task) {
                                setTimeout(() => {
                                    form.val('task-form', {
                                        id: task.id.toString(),
                                        timeline: task.timeline,
                                        title: task.title,
                                        description: task.description,
                                        proof: task.proof,
                                        status: task.status.toString()
                                    });
                                }, 50);
                            }
                            
                            if (window.innerWidth < 768) {
                                layero.find('.layui-form-label').css({width: '60px', 'font-size': '12px'});
                                layero.find('.layui-input-block').css('margin-left', '70px');
                                layero.find('.layui-input').css({'font-size': '12px', 'height': '32px'});
                            }
                        }
                    }, 
                    function(index) {
                        const formData = form.val('task-form');
                        
                        if (!formData.timeline.trim()) {
                            layer.tips('时间线不能为空', layero.find('input[name="timeline"]'), {tips: 1});
                            return false;
                        }
                        if (!formData.title.trim()) {
                            layer.tips('标题不能为空', layero.find('input[name="title"]'), {tips: 1});
                            return false;
                        }
                        
                        formData.id = formData.id ? parseInt(formData.id) : null;
                        formData.status = parseInt(formData.status);
                        
                        if (!isEdit) {
                            const maxId = taskData.length ? Math.max(...taskData.map(t => t.id)) : 0;
                            formData.id = maxId + 1;
                            taskData.push(formData);
                        } else {
                            const taskIdx = taskData.findIndex(t => t.id === currentEditId);
                            if (taskIdx !== -1) taskData[taskIdx] = formData;
                        }
                        
                        if (saveTaskData()) {
                            initTaskTable();
                            layer.msg(isEdit ? '编辑成功' : '新增成功', {icon: 1, time: 1000});
                        }
                        
                        layer.close(index);
                    }, 
                    function(index) {
                        layer.close(index);
                    });
                }
                
                // 事件监听
                table.on('tool(task-table)', function(obj) {
                    const data = obj.data;
                    const idx = taskData.findIndex(t => t.id === data.id);
                    
                    switch(obj.event) {
                        case 'edit':
                            openTaskDialog(true, data);
                            break;
                        case 'complete':
                            taskData[idx].status = 1;
                            if (saveTaskData()) {
                                initTaskTable();
                                layer.msg('标记为完成', {icon: 1, time: 800});
                            }
                            break;
                        case 'uncomplete':
                            taskData[idx].status = 0;
                            if (saveTaskData()) {
                                initTaskTable();
                                layer.msg('标记为待办', {icon: 0, time: 800});
                            }
                            break;
                        case 'delete':
                            layer.confirm('确定删除这条任务吗？', {
                                title: '删除确认',
                                btn: ['确认删除', '取消'],
                                btnAlign: 'c'
                            }, function(confirmIndex) {
                                taskData.splice(idx, 1);
                                if (saveTaskData()) {
                                    initTaskTable();
                                    layer.msg('删除成功', {icon: 1, time: 800});
                                }
                                layer.close(confirmIndex);
                            });
                            break;
                    }
                });
                
                // 工具栏事件监听
                table.on('toolbar(task-table)', function(obj){
                    switch(obj.event){
                        case 'add':
                            openTaskDialog(false);
                            break;
                        case 'filter':
                            layer.msg('筛选功能已开启', {icon: 1});
                            break;
                        case 'export':
                            layer.msg('导出功能已开启', {icon: 1});
                            break;
                        case 'print':
                            layer.msg('打印功能已开启', {icon: 1});
                            break;
                        case 'tips':
                            layer.alert('任务管理使用提示：<br>' +
                                '1. 点击"新增"按钮添加任务<br>' +
                                '2. 点击"完成"按钮可以标记任务为已完成<br>' +
                                '3. 点击"待办"按钮可以将已完成任务标记为待办<br>' +
                                '4. 点击"编辑"按钮可以修改任务信息<br>' +
                                '5. 点击"删除"按钮可以删除任务', {
                                title: '使用提示',
                                area: ['400px', 'auto'],
                                icon: 0
                            });
                            break;
                    }
                });
                
                // 新增按钮事件
                $('#task-add-btn').on('click', function() {
                    openTaskDialog(false);
                });
                
                // 初始化
                initTaskTable();
            }
        });
    });