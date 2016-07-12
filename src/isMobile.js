export default function isMobile(){
    var userAgent = navigator.userAgent;
    return userAgent.match(/iPhone|iPad|IEMobile|Android/)
}
