exports.ctime = function (){
	var ft=function (time){
		if (time<10){
			return("0"+time);
		} else {
			return(time);
		}
	}
	var currentTime = new Date();
  	return ft(currentTime.getHours())+':'+ft(currentTime.getMinutes())+':'+ft(currentTime.getSeconds());
}