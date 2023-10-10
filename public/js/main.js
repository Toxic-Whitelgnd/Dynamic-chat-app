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

// group chat js starts here
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
                                <i class="fa fa-edit updategrpmsg"  data-bs-toggle="modal" data-id='`+ res.gChat._id + `' data-msg='` + res.gChat.message + `' data-bs-target="#updatemessageGroupChat" ></i>  `
								
								html +=`
								</h5>`;
				
								var date = new Date(res.gChat.createdAt);
								let cdate = date.getDate();
								let cmonth = (date.getMonth()+1) > 9?(date.getMonth()+1):'0'+(date.getMonth()+1);//indx start at 0 so +1
								let cyear = date.getFullYear();
								let getfulldate = cdate+':'+cmonth+':'+cyear;
				
								
								html +=`<div class="user-data"><b>Me</b>`+getfulldate+`</div>`;
							
			
				
								html +=`
								</div>`

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
		<h5><span>`+ data.message + `</span>`;
			
		html2 +=`
				
				</h5>`;

				var date = new Date(data.createdAt);
				let cdate = date.getDate();
				let cmonth = (date.getMonth()+1) > 9?(date.getMonth()+1):'0'+(date.getMonth()+1);//indx start at 0 so +1
				let cyear = date.getFullYear();
				let getfulldate = cdate+':'+cmonth+':'+cyear;

				
				
					html2 +=`<div class="user-data">
					<img src="`+data.sender_id.image+`" class="user-chat-image" />
					<b>`+data.sender_id.name+`</b>`+getfulldate+`
					</div>`;
				

				html2 +=`
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

				// console.log(res);
				console.log(chats);

				var html = "";
				for(let i=0;i<chats.length;i++){
					let className = 'another-user';
					if(chats[i]['sender_id']._id == sender_id){
						className = "current-user";
					}
					html += `<div class='`+className+`'
					id='` +chats[i]['_id'] + `'>
				<h5><span>`+ chats[i]['message'] + `</span>`;
				if(chats[i]['sender_id']._id == sender_id){
					html += `<i class="fa fa-trash deletegprmsg"  data-bs-toggle="modal" data-id='`+ chats[i]['_id'] + `' data-bs-target="#deletegroupChat" ></i>
					<i class="fa fa-edit updategrpmsg"  data-bs-toggle="modal" data-id='`+ chats[i]['_id'] + `' data-msg='` + chats[i]['message'] + `' data-bs-target="#updatemessageGroupChat" ></i>`
				}
						
				html +=`
				
				</h5>`;

				var date = new Date(chats[i]['createdAt']);
				let cdate = date.getDate();
				let cmonth = (date.getMonth()+1) > 9?(date.getMonth()+1):'0'+(date.getMonth()+1);//indx start at 0 so +1
				let cyear = date.getFullYear();
				let getfulldate = cdate+':'+cmonth+':'+cyear;

				if(chats[i]['sender_id']._id == sender_id){
					html +=`<div class="user-data"><b>Me</b>`+getfulldate+`</div>`;
				}
				else{
					html +=`<div class="user-data">
					<img src="`+chats[i]['sender_id'].image+`" class="user-chat-image" />
					<b>`+chats[i]['sender_id'].name+`</b>`+getfulldate+`
					</div>`;
				}

				html +=`
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

// update grp chat
$(document).on('click','.updategrpmsg',function(){

	$('#edit-group-message-id').val($(this).attr('data-id'))
	$('#update-group-message-id').val($(this).attr('data-msg'));
});

$('#edit-group-message-form').submit(function(e){
	e.preventDefault();

	var gid = $('#edit-group-message-id').val();
	var msg = $('#update-group-message-id').val();

	$.ajax({
		type:'post',
		url:'/update-group-chat',
		data:{id:gid,msg:msg},
		success:function(res){
			if(res.success){
				$('#'+gid).find('span').text(msg);
				$('#'+gid).find('.updategrpmsg').attr('data-msg',msg);
				$('#updatemessageGroupChat').modal('hide');

				socket.emit('GroupchatUpdated',{id:gid,msg:msg});
			}
			else{
				alert(res.msg);
			}
		}


	})
});

socket.on('GroupchatUpdatedmsg', (data)=>{
	$('#'+data.id).find('span').text(data.msg);
});


// for payment gateway
var orderId;
var orderAmt;
$(document).on('click','.paynow',function(){
	var amt = $(this).attr('data-val');
	console.log(amt);
	$.ajax({
		url:'/payment-page',
		type:'post',
		data:{amt:amt},
		success:function(res){
			if(res.success == true){
				console.log(res);
				orderId = res.order.id;
				orderAmt = res.order.amount;
				checkoutPayment();
			}
			else{	
				console.log("y i am not getting");
			}
		}
	})
});

// create function to start the checkout pages

function checkoutPayment(){
	console.log("checkout page has been created");
	console.log(orderId);
	console.log(orderAmt);

	var options = {
		"key": "rzp_test_AZ9LyozDGv5aSK", // Enter the Key ID generated from the Dashboard
		"amount":orderAmt.toString(), // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
		"currency": "INR",
		"name": "Akatsuki Organisation",
		"description": "in the test mode transaction",
		"image": "https://w7.pngwing.com/pngs/954/164/png-transparent-akatsuki-logo-thumbnail.png",
		"order_id":orderId, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
		"handler": function (response){
			alert(response.razorpay_payment_id);
			alert(response.razorpay_order_id);
			alert(response.razorpay_signature)
			updatePremiumUser(response.razorpay_payment_id,response.razorpay_order_id,response.razorpay_signature);
		},
		
		"theme": {
			"color": "#3399cc"
		}
	};
	var rzp1 = new Razorpay(options);
	rzp1.on('payment.failed', function (response){
			alert(response.error.code);
			alert(response.error.description);
			alert(response.error.source);
			alert(response.error.step);
			alert(response.error.reason);
			alert(response.error.metadata.order_id);
			alert(response.error.metadata.payment_id);
	});

	rzp1.open();


}

// now its time to push into the database based on the premium plans!
// thre type: S , D ,U
// compare the payment money and assign it to the variabl and pass it to the db
function updatePremiumUser(paymentid,orderid,paymentsignature){
	$.ajax({
		url:'/update-premium-user',
		type:'post',
		data:{userid:sender_id,
			orderAmt:orderAmt,
			paymentid:paymentid,
			orderid:orderid,
			paymentsignature:paymentsignature},
		success:function(res){
			if(res.success){
				console.log("yo lets fk them");
				// after that page reload and show the benfits of the page
				if(res.tag == 'S'){
					console.log("render a supreme page");
					window.location.replace('/get-supreme')
					
				}
				else if(res.tag == 'D'){
					console.log("render a deulex page");
					window.location.replace('/subscription');
				}
				else{
					console.log("render a ultra deulex page");
					window.location.replace('/subscription');
				}
			}
			else{
				console.log("chec kyo");
			}
		}
	})
}
// for supermodal supreme chat
$(document).ready(function () {
	$('.user-list-s').click(function () {
		reciver_id = $(this).attr('data-id');
		$('.start-head-s').hide();
		$('.chat-section-s').show();

		// firing the event in the socket enviroment so we can get the evnt any where in the program
		socket.emit('loadExistSChat', { sender_id: sender_id, reciver_id: reciver_id });
	})


})
// getting the loaded chats
socket.on('GetExistSChat', function (data) {
	$('#chat-container-s').html('');
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
                    <i class="fa fa-trash st"  data-bs-toggle="modal" data-id='`+ chats[i]['_id'] + `' data-bs-target="#deletemessageChat-s" ></i> 
                    <i class="fa fa-edit se"  data-bs-toggle="modal" data-id='`+ chats[i]['_id'] + `' data-msg='` + chats[i]['message'] + `' data-bs-target="#updatemessageChat-s" ></i>
                    `;
		}

		htmls += `</h5>
                            </div>`;
	}
	$('#chat-container-s').append(htmls);
	scrollToBottomS();
});

// SAVING TO THE SERVER
$('#chat-form-s').submit(function (e) {
	e.preventDefault();
	var message = $('#message-s').val();
	console.log("fkk off");

	$.ajax({
		url: '/save-supreme-chat',
		method: 'POST',
		data: {
			sender_id: sender_id,
			reciver_id: reciver_id,
			message: message
		},
		success: function (res) {
			if (res.success) {
				$('#message-s').val('');
				var chat = res.data.message;
				let html = `<div class="current-user" id='` + res.data._id + `'>
                            <h5><span>`+ chat + `</span>
                                <i class="fa fa-trash st"  data-bs-toggle="modal" data-id='`+ res.data._id + `' data-bs-target="#deletemessageChat-s" ></i>
                                <i class="fa fa-edit se"  data-bs-toggle="modal" data-id='`+ res.data._id + `' data-msg='` + res.data.message + `' data-bs-target="#updatemessageChat-s" ></i>  
                            </h5>
                            </div>`;

				$('#chat-container-s').append(html);
				// broadcasting the new msg
				socket.emit('newSChat', res.data);
				scrollToBottom();
			}
			else {
				alert('Failed');
			}
		}
	});

})

socket.on('loadnewSChat', function (data) {
	console.log("came to load new s chat probmlem might be her");
	if (sender_id == data.reciver_id && reciver_id == data.sender_id) {
		let html = `<div class="another-user" id='` + data._id + `'>
                            <h5><span>`+ data.message + `</span>
                                <i class="fa fa-trash st"  data-bs-toggle="modal" data-id='`+ data._id + `' data-bs-target="#deletemessageChat-s" ></i>

                                </h5>
                            </div>`;

		$('#chat-container').append(html);
	}
	scrollToBottomS();
})

// scrolling function
function scrollToBottomS() {
	$('#chat-container-s').animate(
		{
			scrollTop: $('#chat-container-s').offset().top + $('#chat-container-s')[0].scrollHeight
		}, 0
	)
};

// deleting the msg 
$(document).on('click', '.st', function (e) {

	let msg = $(this).parent().text();
	$('#delete-message-s').text(msg);

	$('#delete-message-id-s').val($(this).attr('data-id'));

})

// sending the deleting id to the server
$('#delete-message-form-s').submit(function (e) {
	e.preventDefault();

	var id = $('#delete-message-id-s').val();

	$.ajax({
		url: '/delete-supreme-chat',
		type: 'POST',
		data: { id: id },
		success: function (res) {
			if (res.success == true) {
				$('#' + id).remove();
				// for closing the modal
				$('#deletemessageChat-s').modal('hide');

				// need to know the other user so broadcast
				socket.emit('SchatDeleted', id);
			}
			else {
				alert(res.message);
			}
		}
	})

});

socket.on('SchatmessageDeleted', (id) => {
	$('#' + id).remove();
})

// updating the message
$(document).on('click', '.se', function () {
	$('#edit-message-id-s').val($(this).attr('data-id'));
	$('#update-message-id-s').val($(this).attr('data-msg'));
	console.log("here in click faedit");
})

// sending the updating id to the server
$('#edit-message-form-s').submit(function (e) {
	e.preventDefault();

	var id = $('#edit-message-id-s').val();
	var msg = $('#update-message-id-s').val();

	$.ajax({
		url: '/update-supreme-chat',
		type: 'POST',
		data: { id: id, message: msg },
		success: function (res) {
			if (res.success == true) {

				// for closing the modal
				$('#updatemessageChat-s').modal('hide');
				$('#' + id).find('span').text(msg);
				$('#' + id).find('.fa-edit').attr('data-msg', msg);
				// need to know the other user so broadcast
				socket.emit('SchatUpdated', { id: id, message: msg });
			}
			else {
				alert(res.message);
			}
		}
	})

});

socket.on('SchatmessageUpdated', (data) => {
	$('#' + data.id).find('span').text(data.message);
})
