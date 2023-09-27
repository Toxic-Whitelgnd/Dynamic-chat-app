(function ($) {

	"use strict";

	var fullHeight = function () {

		$('.js-fullheight').css('height', $(window).height());
		$(window).resize(function () {
			$('.js-fullheight').css('height', $(window).height());
		});

	};
	fullHeight();

	$('#sidebarCollapse').on('click', function () {
		$('#sidebar').toggleClass('active');
	});

})(jQuery);


// ----------------------------- Multiple dynamic chat ----------------------------------

function getCookie(name) {
	let matches = document.cookie.match(new RegExp(
		"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	));
	return matches ? decodeURIComponent(matches[1]) : undefined;
}

var userData = JSON.parse(getCookie('user'));

var sender_id = userData._id;
var reciver_id;
var global_group_id;
var socket = io('/user-server', {
	auth: {
		token: userData._id,
	}
});


$(document).ready(function () {
	$('.user-list').click(function () {
		reciver_id = $(this).attr('data-id');
		$('.start-head').hide();
		$('.chat-section').show();

		// firing the event in the socket enviroment so we can get the evnt any where in the program
		socket.emit('loadExistChat', { sender_id: sender_id, reciver_id: reciver_id });
	})


})
// getting the loaded chats
socket.on('GetExistChat', function (data) {
	$('#chat-container').html('');
	let htmls = '';
	var chats = data.chats;
	for (let i = 0; i < chats.length; i++) {
		let addClass = ''
		if (chats[i]['sender_id'] == sender_id) {
			addClass = 'current-user';
		}
		else {
			addClass = 'another-user';
		}
		htmls += `<div class='` + addClass + `' id='` + chats[i]['_id'] + `'>
                            <h5><span>`+ chats[i]['message'] + `</span>`;
		if (chats[i]['sender_id'] == sender_id) {
			htmls += `
                    <i class="fa fa-trash"  data-bs-toggle="modal" data-id='`+ chats[i]['_id'] + `' data-bs-target="#deletemessageChat" ></i> 
                    <i class="fa fa-edit"  data-bs-toggle="modal" data-id='`+ chats[i]['_id'] + `' data-msg='` + chats[i]['message'] + `' data-bs-target="#updatemessageChat" ></i>
                    `;
		}

		htmls += `</h5>
                            </div>`;
	}
	$('#chat-container').append(htmls);
	scrollToBottom();
});

// getting the broadcast
socket.on('getOnlineUser', function (data) {
	$('#' + data.user_id + '-status').text('Online');
	$('#' + data.user_id + '-status').removeClass('offline-status');
	$('#' + data.user_id + '-status').addClass('online-status');

})

socket.on('getOfflineUser', function (data) {
	$('#' + data.user_id + '-status').text('Offline');
	$('#' + data.user_id + '-status').removeClass('online-status');
	$('#' + data.user_id + '-status').addClass('offline-status');

})

// triggering the caht event
$('#chat-form').submit(function (e) {
	e.preventDefault();
	var message = $('#message').val();
	console.log("fkk off");

	$.ajax({
		url: '/save-chat',
		method: 'POST',
		data: {
			sender_id: sender_id,
			reciver_id: reciver_id,
			message: message
		},
		success: function (res) {
			if (res.success) {
				$('#message').val('');
				var chat = res.data.message;
				let html = `<div class="current-user" id='` + res.data._id + `'>
                            <h5><span>`+ chat + `</span>
                                <i class="fa fa-trash"  data-bs-toggle="modal" data-id='`+ res.data._id + `' data-bs-target="#deletemessageChat" ></i>
                                <i class="fa fa-edit"  data-bs-toggle="modal" data-id='`+ res.data._id + `' data-msg='` + res.data.message + `' data-bs-target="#updatemessageChat" ></i>  
                            </h5>
                            </div>`;

				$('#chat-container').append(html);
				// broadcasting the new msg
				socket.emit('newChat', res.data);
				scrollToBottom();
			}
			else {
				alert('Failed');
			}
		}
	});

})

socket.on('loadnewChat', function (data) {
	if (sender_id == data.reciver_id && reciver_id == data.sender_id) {
		let html = `<div class="another-user" id='` + data._id + `'>
                            <h5><span>`+ data.message + `</span>
                                <i class="fa fa-trash"  data-bs-toggle="modal" data-id='`+ data._id + `' data-bs-target="#deletemessageChat" ></i>

                                </h5>
                            </div>`;

		$('#chat-container').append(html);
	}
	scrollToBottom();
})

// scrolling function
function scrollToBottom() {
	$('#chat-container').animate(
		{
			scrollTop: $('#chat-container').offset().top + $('#chat-container')[0].scrollHeight
		}, 0
	)
};

// deleting the msg 
$(document).on('click', '.fa-trash', function (e) {

	let msg = $(this).parent().text();
	$('#delete-message').text(msg);

	$('#delete-message-id').val($(this).attr('data-id'));

})

// sending the deleting id to the server
$('#delete-message-form').submit(function (e) {
	e.preventDefault();

	var id = $('#delete-message-id').val();

	$.ajax({
		url: '/delete-chat',
		type: 'POST',
		data: { id: id },
		success: function (res) {
			if (res.success == true) {
				$('#' + id).remove();
				// for closing the modal
				$('#deletemessageChat').modal('hide');

				// need to know the other user so broadcast
				socket.emit('chatDeleted', id);
			}
			else {
				alert(res.message);
			}
		}
	})

});

socket.on('chatmessageDeleted', (id) => {
	$('#' + id).remove();
})

// updating the message
$(document).on('click', '.fa-edit', function () {
	$('#edit-message-id').val($(this).attr('data-id'));
	$('#update-message-id').val($(this).attr('data-msg'));
	console.log("here in click faedit");
})

// sending the updating id to the server
$('#edit-message-form').submit(function (e) {
	e.preventDefault();

	var id = $('#edit-message-id').val();
	var msg = $('#update-message-id').val();

	$.ajax({
		url: '/update-chat',
		type: 'POST',
		data: { id: id, message: msg },
		success: function (res) {
			if (res.success == true) {

				// for closing the modal
				$('#updatemessageChat').modal('hide');
				$('#' + id).find('span').text(msg);
				$('#' + id).find('.fa-edit').attr('data-msg', msg);
				// need to know the other user so broadcast
				socket.emit('chatUpdated', { id: id, message: msg });
			}
			else {
				alert(res.message);
			}
		}
	})

});

socket.on('chatmessageUpdated', (data) => {
	$('#' + data.id).find('span').text(data.message);
})

// for adding members
$('.addMember').click(function(){
	var grpid = $(this).attr('data-id');
	var limit = $(this).attr('data-limit');

	$('#group_id').val(grpid);
	$('#limit').val(limit);

	console.log("came here for testing",grpid);

	$.ajax({
		url:'/get-members',
		type:'POST',
		data:{group_id:grpid},
		success:function(res){
			console.log(res);
			if(res.success == true){
				let users = res.grpusers
				let html = '';
				console.log(users.length);
				for(let i=0;i<users.length;i++){

					let isMmeberOfGrp = users[i]['member'].length > 0 ?true:false;

					html +=`
					<tr>
					<td>
					<input type="checkbox" `+(isMmeberOfGrp?'checked':'')+`  name="members[]" value=`+users[i]['_id']+` />
					</td>
					<td>`+users[i]['name']+`</td>
					</tr>
					`
				}
				$('.addMembersinTable').html(html);
			}
			else{
				alert("error from server side")
			}
		}
	})
})

// adding mbers to the grp 
$('#addmembers-form').submit(function(e){
	e.preventDefault();

	var formData = $(this).serialize();
	$.ajax({
		type:'POST',
		url:'/add-members',
		data:formData,
		success:function(res){
			if(res.success == true){
				$('#addMembersmodal').modal('hide');
				$('#addmembers-form')[0].reset(); 
				alert(res.msg);
			}
			else{
				$('#add-member-error').text(res.msg);
				setTimeout(()=>{
					$('#add-member-error').text('');
				},3000)
			}
		}
	})
});

// for updating the group
$('.UpdateGroup').click(function(){
	var obj = JSON.parse($(this).attr('data-obj'));

	$('#last_limit').val(obj.limit);
	$('#update_group_id').val(obj._id);
	$('#group_name').val(obj.name);
	$('#group_limit').val(obj.limit);

})

$('#updategroup-form').submit(function(e){
	e.preventDefault();

	$.ajax({
		url:'/update-chat-group',
		type:'POST',
		data:new FormData(this),
		contentType: false,
		cache:false,
		processData:false,
		success:function(res){
			alert(res.msg);
			if(res.success == true) {
				location.reload();
			}
		}
	})
})

// for deleting caht group
$('.DeleteGroup').click(function(){
	$('#delete_group_id').val($(this).attr('data-id'));
	$('#delete_group_name').text($(this).attr('data-name'));
})

$('#deletegroup-form').submit(function(event){
	event.preventDefault();
	var formdata = $(this).serialize();
	$.ajax({
		url:"/delete-chat-group",
		type:'post',
		data: formdata,
		success:function(res){
			alert(res.msg);
			if(res.success == true){
				location.reload();
			}
		}
	})
});

// for making a sharable copy link
$('.CopyGroup').click(function(){

	$(this).prepend('<span class="copied_text"> copied </span>');

	var grpid = $(this).attr('data-id');
	var url = window.location.host+'/share-group/'+grpid;
	var temp = $('<input>')
	$('body').append(temp);
	temp.val(url).select();
	document.execCommand('copy');

	temp.remove();

	setTimeout(function(){
		$('.copied_text').remove();
	},2000);

})

// for joining the grp
$('.join-now').click(function(){
	$(this).text('...wait')
	$(this).attr('disabled', 'disabled');

	var grpid = $(this).attr('data-id');

	$.ajax({
		url:'/join-group',
		type:'POST',
		data:{group_id:grpid},
		success: function(res){
			alert(res.msg);
			if(res.success == true){
				location.reload();
			}
			else{
				$(this).text('Join Now');
				$(this).removeAttr('disabled');
			}
		}
	})
});

// group chat container js
$('.group-chat-list').click(function(){
	$('.group-start-head').hide();
	$('.group-chat-section').show();

	global_group_id = $(this).attr('data-id');

	loadGroupChat();

})

// saving the group chat
$('#group-chat-form').submit(function (e) {
	e.preventDefault();
	var message = $('#group-message').val();
	console.log("fkk off");

	$.ajax({
		url: '/group-chat-save',
		method: 'POST',
		data: {
			sender_id: sender_id,
			group_id: global_group_id,
			message: message
		},
		success: function (res) {
			if (res.success) {
				$('#group-message').val('');
				var gchat = res.gChat.message;
				let html = `<div class="current-user" id='` + res.gChat._id + `'>
                            <h5><span>`+ gchat + `</span>
                                <i class="fa fa-trash deletegprmsg"  data-bs-toggle="modal" data-id='`+ res.gChat._id + `' data-bs-target="#deletegroupChat" ></i>
                                <i class="fa fa-edit"  data-bs-toggle="modal" data-id='`+ res.gChat._id + `' data-msg='` + res.gChat.message + `' data-bs-target="#updatemessageChat" ></i>  
                            </h5>
                            </div>`;

				$('#group-chat-container').append(html);
				// broadcasting the new msg
				socket.emit('groupnewChat', res.gChat);
				scrollGroupToBottom();
			}
			else {
				alert('Failed');
			}
		}
	});

});
// getting the group chat messages
socket.on('loadnewGroupChat', function(data){
	if(global_group_id == data.group_id){
		let html2 = `<div class="another-user" id='` + data._id + `'>
		<h5><span>`+ data.message + `</span>
			<i class="fa fa-trash deletegprmsg"  data-bs-toggle="modal" data-id='`+ data._id + `' data-bs-target="#deletegroupChat" ></i>
			<i class="fa fa-edit"  data-bs-toggle="modal" data-id='`+ data._id + `' data-msg='` + data.message + `' data-bs-target="#updatemessageChat" ></i>  
		</h5>
		</div>`

		$('#group-chat-container').append(html2);
		scrollGroupToBottom();
	}
})

// loading the group chats
function loadGroupChat(){
	$.ajax({
		url:'/load-group-chat',
		type:'post',
		data:{group_id:global_group_id},
		success:function(res){
			if (res.success == true) {
				var chats = res.grpchat;

				

				var html = "";
				for(let i=0;i<chats.length;i++){
					let className = 'another-user';
					if(chats[i]['sender_id'] == sender_id){
						className = "current-user";
					}
					html += `<div class='`+className+`'
					id='` +chats[i]['_id'] + `'>
				<h5><span>`+ chats[i]['message'] + `</span>`;
				if(chats[i]['sender_id'] == sender_id){
					html += `<i class="fa fa-trash deletegprmsg"  data-bs-toggle="modal" data-id='`+ chats[i]['_id'] + `' data-bs-target="#deletegroupChat" ></i>
					<i class="fa fa-edit"  data-bs-toggle="modal" data-id='`+ chats[i]['_id'] + `' data-msg='` + chats[i]['message'] + `' data-bs-target="#updatemessageChat" ></i>`
				}
						
				html +=`
				</h5>
				</div>`
				}
				$('#group-chat-container').html(html);

				
			}
			else{
				alert(res.msg)
			}
		}
	})
};

$(document).on('click','.deletegprmsg',function(){

	var msg = $(this).parent().find('span').text();

	$('#delete-grp-message-id').val($(this).attr('data-id'))
	$('#delete-grp-message').text(msg);
});

$('#delete-group-message-form').submit(function(e){
	e.preventDefault();

	var gid = $('#delete-grp-message-id').val();

	$.ajax({
		type:'post',
		url:'/delete-group-chat',
		data:{id:gid},
		success:function(res){
			if(res.success){
				$('#'+gid).remove();
				$('#deletegroupChat').modal('hide');

				socket.emit('GroupchatDeleted',gid);
			}
			else{
				alert(res.msg);
			}
		}


	})
})

socket.on('GroupchatDeletedmsg',(data)=>{
	$('#'+data).remove();
})

function scrollGroupToBottom() {
	$('#group-chat-container').animate(
		{
			scrollTop: $('#group-chat-container').offset().top + $('#group-chat-container')[0].scrollHeight
		}, 0
	)
};


