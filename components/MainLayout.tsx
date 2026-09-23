import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";

const MainLayout = (props: React.PropsWithChildren) => {
  return (
    <div>
      <SmoothScroll />
      <Header />
      {props.children}
      <Footer />
    </div>
  );
};

export default MainLayout;
