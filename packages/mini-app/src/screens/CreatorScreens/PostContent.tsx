import { InfoDrawer } from "~/components/shared/InfoDrawer";
import creatorBgVectorSvg from "../../../public/creator_bg_vector.svg";
import zorbSvg2 from "../../../public/zorb2.svg";
import logoSvg from "../../../public/logo.svg";
import infoIcon from "../../../public/info.svg";
import arrowRightUp2 from "../../../public/arrow_up_right_2.svg";
import { useState } from "react";
import { PostingTimer } from "~/components/shared/PostingTimer";

export function PostContentScreen({
  onNavigateToPreContest,
}: {
  onNavigateToPreContest: () => void;
}) {
  const [isInfoDrawerOpen, setIsInfoDrawerOpen] = useState(false);

  return (
    <div className="h-screen bg-white relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={creatorBgVectorSvg.src}
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="absolute bottom-0 w-full h-full z-0">
        <img src={zorbSvg2.src} alt="" className="absolute bottom-0 w-full" />
      </div>
      <div className="relative z-10 h-full flex flex-col px-4">
        <div className="flex justify-between items-center pt-3">
          <div className="flex items-center gap-2">
            <img src={logoSvg.src} alt="" className="w-12 h-12" />
            <h1
              className="font-dela-gothic-one text-2xl font-bold"
              style={{
                color: "transparent",
                WebkitTextStroke: "1px #1C7807",
                letterSpacing: "0.1em",
              }}
            >
              BLITZ
            </h1>
          </div>
          <button onClick={() => setIsInfoDrawerOpen(true)}>
            <img src={infoIcon.src} alt="info" className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center text-center max-w-[400px]">
            <h2
              className="font-dela-gothic-one text-4xl font-bold mb-8"
              style={{
                color: "#F1F1F1",
                WebkitTextStroke: "1px #1C7807",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              KICKSTART
              <br />
              THE CONTEST
            </h2>

            <PostingTimer time={new Date(Date.now() + 5 * 60 * 1000)} />

            <p
              className="font-schibsted-grotesk font-medium text-lg mb-4"
              style={{ color: "#124D04" }}
            >
              Post your content in the next 5 minutes.
            </p>
            <button
              className="font-schibsted-grotesk w-full px-6 py-4 text-lg font-medium rounded-full shadow-lg"
              style={{
                color: "#124D04",
                background:
                  "linear-gradient(to right, #A6EC9C 0%, #B8EF92 100%)",
              }}
              onClick={onNavigateToPreContest}
            >
              <div className="flex justify-center items-center gap-2">
                <span>Post Now</span>
                <img src={arrowRightUp2.src} alt="arrow" className="w-3 h-3" />
              </div>
            </button>
            <p
              className="text-md mt-2"
              style={{
                color: "#89A682",
              }}
            >
              No post = automatic forfeit
            </p>
          </div>
        </div>
      </div>

      <InfoDrawer
        isOpen={isInfoDrawerOpen}
        onClose={() => setIsInfoDrawerOpen(false)}
      />
    </div>
  );
}
