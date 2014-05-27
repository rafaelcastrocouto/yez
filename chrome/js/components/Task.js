var Task = absurd.component('Task', {
	css: TaskCSS(),
	html: TaskTemplate(),
	mode: 'dashboard',
	started: false,
	logContent: '',
	data: {
		id: '',
		name: 'Task',
		cwd: '',
		commands: [''],
		independent: []
	},
	constructor: function(data) {
		this.data = data;
		this.setMode(data ? 'dashboard' : 'edit');
		if(data.terminal) this.terminalInit();
	},
	getId: function() {
		return this.data && this.data.id && this.data.id != '' ? this.data.id : getId();
	},
	setMode: function(m) {
		this.mode = m;
		this.populate();
	},
	gotoHome: function(e) {
		e.preventDefault();
		this.dispatch('home');
	},
	// *********************************************** edit mode
	goToEditMode: function(e, dom) {
		e && e.preventDefault();
		this.setMode('edit');
		this.qs('input[name="name"]').focus();
	},
	addCommand: function(e, index) {
		index = parseInt(index);
		this.data.commands.splice(index+1, 0, '');
		this.populate();
	},
	removeCommand: function(e, index) {
		index = parseInt(index);
		if(this.data.commands.length === 1) return;
		this.data.commands.splice(index, 1);
		this.populate();
	},
	independentCommand: function(e, index) {
		index = parseInt(index);
		if(!this.data.independent) {
			this.data.independent = [];
			this.data.independent.push(index);
		} else {
			var i = this.data.independent.indexOf(index);
			if(i >= 0) {
				this.data.independent.splice(i, 1);
			} else {
				this.data.independent.push(index);
			}
		}
		this.populate();
	},
	changeCommand: function(e, index) {
		index = parseInt(index);
		this.data.commands[index] = e.target.value.replace(/"/g, '&quot;');
		e.target.setAttribute('value', e.target.value);
	},
	changeCommandName: function(e) {
		this.data.name = e.target.value;
	},
	changeCWD: function(e) {
		this.data.cwd = e.target.value;
	},
	saveCommand: function(e) {
		e.preventDefault();
		this.setMode('dashboard');
		this.dispatch('save');
	},
	deleteTask: function(e) {
		if(confirm('Are you sure?')) {
			this.dispatch('delete-task');
		}
	},
	chooseCWD: function(e) {
		e.preventDefault();
		CWD(this.data.cwd, function(cwd) {
			if(cwd) {
				this.data.cwd = cwd;
				this.populate();
			}
		}.bind(this));
	},
	// *********************************************** dashboard mode
	startTasks: function(e) {
		e && e.preventDefault();
		if(this.started) return;
		this.setMode('dashboard');
		this.started = true;
		this.endedCommands = 0;
		this.commandsToProcess = this.data.commands.slice(0);
		this.populate();
		this.processTask();
		this.dispatch('save');
		this.endedCommands = 0;
		// this.qs('.stdin-field').focus();
	},
	stopTasks: function(e) {
		e && e.preventDefault();
		this.setMode('dashboard');
		this.dispatch('data', {
			id: this.data.id,
			action: 'stop-command'
		});
		this.commandsToProcess = [];
		this.endedCommands = -2;
		this.log('<p class="log-command"><i class="fa fa-angle-right"></i> stopping ...</p>');
	},
	restartTasks: function(e) {
		e && e.preventDefault();
		this.restart = true;
		this.stopTasks(e);
	},
	// Loop that sends the commands
	processTask: function() {
		if(!this.commandsToProcess || this.commandsToProcess.length == 0) {
			if(this.endedCommands >= this.data.commands.length || this.endedCommands == -1) {
				this.started = false;
				this.populate();
				this.log('<p class="log-task-end">task finished</p>');
				this.dispatch('save');
				this.dispatch('ended');
				if(this.restart) {
					this.restart = false;
					this.clearLog().startTasks();
				}
			}
			return;
		}
		var index = this.data.commands.length - this.commandsToProcess.length;
		var command = this.commandsToProcess.shift();
		// ********************************************************* chrome
		if(command.indexOf('chrome:') === 0) {
			var parts = command.split(':'), self = this;
			parts.shift();
			chrome.runtime.sendMessage({
				type: parts.shift(),
				data: parts.join(':')
			}, function(res) {
				if(res) {
					self.response({ action: 'data', data: typeof res == 'object' ? JSON.stringify(res): res });
				}
				self.response({ action: 'end', err: false, code: 'none'});
			});
			this.log('<p class="log-command"><i class="fa fa-angle-right"></i> ' + command + '</p>');

		// ********************************************************* nodejs
		} else {
			this.log('<p class="log-command"><i class="fa fa-angle-right"></i> ' + command + '</p>');
			this.dispatch('data', {
				id: this.data.id,
				action: 'run-command',
				command: command,
				cwd: this.data.cwd
			});
		}
		// check if it is locked to the chain
		if(this.data.independent && this.data.independent.indexOf(index) >= 0) {
			this.processTask();
		}
	},
	// process the response from the Node.js part
	response: function(data) {
		switch(data.action) {
			case 'err':
				this.log('<p class="log-error">' + data.msg + '</p>');
			break;
			case 'data':
				this.log('<p class="log-response">' + data.data + '</p>');
			break;
			case 'end':
				if(data.err != false) {
					for(var i=0; i<data.err.length; i++) {
						var err = data.err[i], errDesc;
						errDesc = err.code == 'ENOENT' ? 'Wrong file, directory or command name.<br />Error: ' : '';						
						if(typeof err == 'object') err = JSON.stringify(err);
						this.log('<p class="log-error">' + errDesc + err + '</p>');
					}
				}
				this.log('<p class="log-end">end (code: ' + data.code + ')</p>');
				this.endedCommands += 1;
				this.processTask();
			break;
			case 'exit':
				this.log('<p class="log-end">exit (code: ' + data.code + ', signal: ' + data.signal + ')</p>');
			break;
		}
	},
	log: function(msg, dom) {
		var html = ansi_up.ansi_to_html(msg);
		html = html.replace(/\n/g, '<br />');
		if(!this.logElement) { this.logElement = dom('.dashboard .log').el; }
		if(this.logElement) {
			this.logElement.innerHTML = this.logElement.innerHTML + html;
			this.logElement.scrollTop = this.logElement.scrollHeight;	
		}
		this.logContent = this.logElement.innerHTML;
	},
	clearLog: function() {
		this.logContent = '';
		this.populate();
		return this;
	},
	stdinChanged: function(e) {
		if(e.keyCode === 13) { // enter
			var input = e.target.value;
			this.log('<p class="log-stdin"><i class="fa fa-keyboard-o"></i> ' + input + '</p>');
			e.target.value = '';
			Yez.send({
				action: this.data.terminal ? 'terminal' : 'stdin-input',
				id: this.getId(),
				input: input,
				cwd: this.data.cwd
			}, function(data) {
				// no need to process the result
			}.bind(this));
		} else if(e.keyCode === 27) { // escape
			e.target.value = '';
		}
	},
	// *********************************************** terminal
	terminalInit: function() {
		var self = this;
		this.html['div[class="task-<% getId() %>"]']['.sub-nav'] = [
			{ 'a[href="#" class="operation" data-absurd-event="click:deleteTask"]': '<i class="fa fa-times-circle-o"></i> Delete'}
		];
		console.log(this.qs('.stdin-field'));
		setTimeout(function() {
			self.qs('.stdin-field').focus();
		}, 200);		
	},
	// *********************************************** keypress signals
	'ctrl+l': function() {
		this.clearLog();
	},
	'ctrl+enter': function() {
		this.restartTasks();
	}
});
function TaskTemplate() {
	return {
		'div[class="task-<% getId() %>"]': {
			'.task-cwd': '<i class="fa fa-location-arrow"></i> <% data.cwd %>',
			'.breadcrumbs': [
				'<i class="fa fa-angle-right"></i>',
				{ 'a[href="#" data-absurd-event="click:gotoHome"]': '&nbsp;Home'},
				' / <% data.name %>'
			],
			'.sub-nav': [
				{ 'a[href="#" class="operation<% started ? " hidden" : "" %>" data-absurd-event="click:startTasks"]': '<i class="fa fa-refresh"></i> Start'},
				{ 'a[href="#" class="operation<% started ? "" : " hidden" %>" data-absurd-event="click:restartTasks"]': '<i class="fa fa-repeat"></i> Restart'},
				{ 'a[href="#" class="operation<% started ? "" : " hidden" %>" data-absurd-event="click:stopTasks"]': '<i class="fa fa-stop"></i> Stop'},
				{ 'a[href="#" class="operation" data-absurd-event="click:goToEditMode"]': '<i class="fa fa-edit"></i> Edit'},
				{ 'a[href="#" class="operation" data-absurd-event="click:deleteTask"]': '<i class="fa fa-times-circle-o"></i> Delete'}
			],
			'.edit': [
				{
					'.element': {
						label: 'Name',
						'.field': {
							'input[type="text" name="name" value="<% data.name %>" data-absurd-event="keyup:changeCommandName"]': ''
						}
					}
				},
				{
					'.element': {
						label: 'Working directory',
						'.field': {
							'input[type="text" name="cwd" value="<% data.cwd %>" data-absurd-event="change:changeCWD"]': ''
						},
						'a.sub-right[href="#" data-absurd-event="click:chooseCWD:<% i %>"]': '<i class="fa fa-folder-open"></i>'
					}
				},
				'<% for(var i=0; i<data.commands.length; i++) { \
					var c = data.commands[i]; \
					var indIcon = data.independent && data.independent.indexOf(i) >= 0 ? "fa-unlock" : "fa-lock"; \
					var tip = indIcon == "fa-lock" ? "Run it independently" : "Lock the command to the chain"; \
				%>',
				{
					'.element': {
						label: '<i class="fa fa-wrench"></i> <% i+1 %>',
						'.field': {
							'input[type="text" value="<% c %>" data-absurd-event="keyup:changeCommand:<% i %>"]': ''
						},
						'a.sub-left[href="#" title="Add new command" data-absurd-event="click:addCommand:<% i %>"]': '<i class="fa fa-plus-circle"></i>',
						'a.sub-right[href="#" title="Remove the command" data-absurd-event="click:removeCommand:<% i %>"]': '<i class="fa fa-minus-circle"></i>',
						'a.sub-independent[href="#" title="<% tip %>" data-absurd-event="click:independentCommand:<% i %>"]': '<i class="fa <% indIcon %>"></i>'
					}
				},
				'<% } %>',
				{
					'.actions': [
						{ 'a[href="#" data-absurd-event="click:saveCommand"]': '<i class="fa fa-check-circle-o"></i> Save' }
					]
				}
			],
			'.dashboard': [
				{ 'a[href="#" class="clear-log" data-absurd-event="click:clearLog"]': '<i class="fa fa-eraser"></i> Clear'},
				{ '.log': '<% logContent %>' },
				{ 'input[class="stdin-field" data-absurd-event="keyup:stdinChanged"]': ''},
				{ '.stdin-field-tooltip': '<i class="fa fa-angle-right"></i>'}
			]
		}
	}
}
function TaskCSS() {
	return {
		'.task-<% getId() %>': {
			'.task-cwd': TaskCSSCWD(),
			'.breadcrumbs': TaskCSSBreadcrumbs(),
			'.edit': TaskCSSEdit(),
			'.dashboard': TaskCSSDashboard(),
			'.sub-nav': TaskCSSSubNav()
		}
	}
}
function TaskCSSCWD() {
	return {
		pos: 'a',
		top: '56px',
		right: '12px',
		color: '#575757',
		fz: '14px'
	}
}
function TaskCSSBreadcrumbs() {
	return {
		bxz: 'bb',
		pad: '6px 14px',
		bg: '#F9F7F2',
		bdb: 'solid 1px #E7E7E7',
		bdt: 'solid 1px #fff',
		color: '#575757',
		fz: '14px',
		a: {
			color: '#999',
			fz: '14px',
			ted: 'underline',
			'&:hover': {
				color: '#000'
			}
		}
	};
}
function TaskCSSEdit() {
	return {
		bxz: 'bb',
		pad: '10px',
		display: '<% mode == "edit" ? "block" : "none" %>',
		'.element': {
			pos: 'r',
			wid: '100%',
			bxz: 'bb',
			mar: '6px 0 6px 0',
			label: {
				wid: '30%',
				pad: '0 20px 0 0',
				bxz: 'bb',
				bg: '#EDE9E0',
				fl: 'l',
				pad: '10px',
				bdtlrs: '10px',
				bdblrs: '10px',
				ta: 'r',
				bdr: 'solid 2px #DECAB6',
				bdb: 'solid 1px #999',
				hei: '47px',
				ov: 'h'
			},
			'.field': {
				wid: '70%',
				fl: 'l',
				bxz: 'bb',
				bg: '#F8F5EF',
				bdtrrs: '10px',
				bdbrrs: '10px',
				bdb: 'solid 1px #999',
				input: {
					hei: '46px',
					bd: 'n',
					bg: 'n',
					bxz: 'bb',
					wid: '100%',
					pad: '10px'
				}
			},
			'&:after': {
				content: '" "',
				d: 'tb',
				clear: 'both'
			},
			'.sub-left, .sub-independent': {
				color: '#000',
				d: 'b',
				pos: 'a',
				top: '10px',
				left: '10px',
				pad: '0 10px',
				bg: '#F5F3EF',
				bdrsa: '4px',
				'&:hover': { bg: '#D5CCBB' }
			},
			'.sub-right': {
				color: '#000',
				d: 'b',
				pos: 'a',
				top: '10px',
				right: '10px',
				pad: '0 10px',
				bg: '#FBFAF7',
				bdrsa: '4px',
				'&:hover': { bg: '#E6DBC4' }
			},
			'.sub-independent': {
				ta: 'c',
				bxz: 'bb',
				width: '34px',
				top: '10px',
				left: '53px'
			}
		},
		'.actions': {
			clear: 'both',
			mar: '0 0 0 30%',
			pad: '6px 0 0 0',
			a: button(),
			'.cancel': buttonTransparent()
		}
	};
}
function TaskCSSDashboard() {
	return {
		display: '<% mode == "dashboard" ? "block" : "none" %>',
		bxz: 'bb',
		pad: '10px',
		h1: {
			mar: '20px 0 20px 0',
			pad: 0,
			fz: '30px'
		},
		'.log': {
			bxz: 'bb',
			pos: 'a',
			top: '144px',
			left: '10px',
			pad: '10px',
			bg: '#FAFAFA',
			wid: 'calc(100% - 18px)',
			hei: 'calc(100% - 187px)',
			fz: '12px',
			lh: '20px',
			bdrsa: '4px',
			ovx: 'h',
			ovy: 's',
			p: {
				pad: '0 4px',
				mar: '0 0 4px 0',
				bdrsa: '2px'
			},
			'.log-command': {
				bg: '#C0DFE7',
				bdb: 'solid 1px #E1E1E1'
			},
			'.log-error': {
				bg: '#F39C9C',
				bdb: 'solid 1px #E1E1E1'
			},
			'.log-end': {
				ta: 'r'
			},
			'.log-response': {
				lh: '16px'
			},
			'.log-task-end': {
				bg: '#87E789',
				bdb: 'solid 1px #E1E1E1'
			},
			'.log-info': {
				bg: '#C6E7E8',
				color: '#2E7072',
				bdb: 'solid 1px #66BFC1',
				bdrsa: '4px'
			},
			'.log-stdin': {
				bg: '#C6E7E8',
				color: '#2E7072',
				bdb: 'solid 1px #66BFC1',
				bdrsa: '4px'
			}
		},
		'.stdin-field': {
			bxz: 'bb',
			pos: 'a',
			bottom: '7px',
			right: '8px',
			pad: '4px 4px 4px 18px',
			bdrsa: '4px',
			wid: 'calc(100% - 17px)',
			bd: 'solid 1px #C5C5C5',
			ff: "'Roboto', 'sans-serif'"
		},
		'.stdin-field-tooltip': {
			pos: 'a',
			bottom: '10px',
			left: '18px',
			color: '#999'
		},
		'.clear-log': {
			color: '#999',
			fz: '12px',
			pos: 'a',
			top: '104px',
			right: '12px',
			ted: 'n',
			'&:hover': {
				color: '#000'
			}
		}
	}
}
function TaskCSSSubNav() {
	return {
		pad: '10px 0 0 10px',
		'.operation': button(),
		'.hidden': { d: 'n' }
	}
}