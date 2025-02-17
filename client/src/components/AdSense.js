import { useEffect } from "react";

const AdSense = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8381793487780675";
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="ads-container">
      <ins className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-8381793487780675"
        data-ad-slot="1234567890" // 실제 광고 슬롯 ID로 변경
        data-ad-format="auto"
        data-full-width-responsive="true">
      </ins>
      <script>
        {`(adsbygoogle = window.adsbygoogle || []).push({});`}
      </script>
    </div>
  );
};

export default AdSense;
