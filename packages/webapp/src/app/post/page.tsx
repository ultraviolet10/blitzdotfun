"use client";

import Image from "next/image";
import arrowRightUp2 from "@/assets/arrow_up_right_2.svg";
import { AuthGuard } from "@/components/AuthGuard";
import { RoutingWrapper } from "@/components/RoutingWrapper";
import { Header } from "@/components/Header";
import { PostingTimer } from "@/components/PostingTimer";
import { useContest } from "@/hooks/useContest";

export default function PostPage() {
  return (
    <AuthGuard>
      <RoutingWrapper>
        <Post />
      </RoutingWrapper>
    </AuthGuard>
  );
}

function Post() {
  const { contest, loading } = useContest();

  const handlePostNow = () => {
    // Navigate to posting interface or external platform
    window.open("https://zora.co/", "_blank");
  };

  // Show loading state while checking contest data
  if (loading) {
    return (
      <div className="min-h-screen size-full flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 border-2 border-[#2A2A2A] border-t-[#67CE67] rounded-full animate-spin"></div>
            <span className="text-[#67CE67]">Loading contest info...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen size-full flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl text-center space-y-6">
          {/* Main Heading */}
          <div className="space-y-2">
            <h2
              className="font-dela-gothic-one text-4xl font-bold"
              style={{
                color: "#F1F1F1",
                WebkitTextStroke: "1px #1C7807",
                letterSpacing: "0.1em",
              }}
            >
              KICKSTART THE CONTEST
            </h2>
          </div>

          {/* Timer */}
          <div className="flex justify-center">
            <PostingTimer 
              time={contest?.contentDeadline ? new Date(contest.contentDeadline) : undefined} 
            />
          </div>

          {/* Instruction Text */}
          <p
            className="font-schibsted-grotesk font-medium text-lg"
            style={{
              color: "#124D04",
            }}
          >
            Post your content in the next 5 minutes.
          </p>

          {/* Post Now Button */}
          <button
            className="font-schibsted-grotesk w-full px-6 py-3 text-base font-semibold rounded-full shadow-lg transition-all duration-200 hover:shadow-xl active:scale-[0.98]"
            style={{
              color: "#124D04",
              background: "linear-gradient(to right, #A6EC9C 0%, #B8EF92 100%)",
            }}
            onClick={handlePostNow}
          >
            <div className="flex justify-center items-center gap-2">
              <span>Post Now</span>
              <Image src={arrowRightUp2} alt="arrow" width={12} height={12} />
            </div>
          </button>
        </div>
      </div>

      <div className="pb-8 text-center">
        <h3
          className="font-dela-gothic-one text-2xl font-bold opacity-60"
          style={{
            color: "#F1F1F1",
            WebkitTextStroke: "1px #1C7807",
            letterSpacing: "0.1em",
          }}
        >
          THE ARENA FOR CREATOR COINS.
        </h3>
      </div>
    </div>
  );
}
