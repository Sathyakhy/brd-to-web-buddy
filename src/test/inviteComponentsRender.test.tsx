import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import KhmerTraditionalCover from "@/components/templates/KhmerTraditionalCover";
import SignaturePackageCover from "@/components/templates/SignaturePackageCover";
import FloatingLanguageSwitch from "@/components/templates/FloatingLanguageSwitch";
import FloatingMusicPlayer from "@/components/templates/FloatingMusicPlayer";
import InvitationTemplate from "@/components/templates/InvitationTemplate";
import InvitePage from "@/pages/public/InvitePage";
import { MemoryRouter, Route, Routes } from "react-router-dom";

describe("Public Invite Page Components Rendering Test", () => {
  it("renders InvitePage component with broadcast-en link without throwing", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/kunsong-kimsing/invite?token=broadcast-en"]}>
        <Routes>
          <Route path="/:slug/invite" element={<InvitePage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it("renders InvitePage component with broadcast-km link without throwing", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/kunsong-kimsing/invite?token=broadcast-km"]}>
        <Routes>
          <Route path="/:slug/invite" element={<InvitePage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it("renders InvitePage component with individual guest-token-en link without throwing", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/kunsong-kimsing/invite?token=mike-kang-en"]}>
        <Routes>
          <Route path="/:slug/invite" element={<InvitePage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it("renders InvitePage component without token (open invite default) without throwing", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/kunsong-kimsing/invite"]}>
        <Routes>
          <Route path="/:slug/invite" element={<InvitePage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it("renders KhmerTraditionalCover in Khmer without throwing", () => {
    const { container } = render(
      <KhmerTraditionalCover
        guestName="ភ្ញៀវកិត្តិយស"
        title="សិរីមង្គលអាពាហ៍ពិពាហ៍"
        onOpen={() => {}}
      />
    );
    expect(container).toBeTruthy();
  });

  it("renders KhmerTraditionalCover in English without throwing", () => {
    const { container } = render(
      <KhmerTraditionalCover
        guestName="Honored Guest"
        title="Wedding Celebration"
        language="en"
        onOpen={() => {}}
      />
    );
    expect(container).toBeTruthy();
  });

  it("renders SignaturePackageCover without throwing", () => {
    const { container } = render(
      <SignaturePackageCover
        guestName="Honored Guest"
        title="Wedding Celebration"
        onOpen={() => {}}
      />
    );
    expect(container).toBeTruthy();
  });

  it("renders FloatingLanguageSwitch and FloatingMusicPlayer without throwing", () => {
    const { container } = render(
      <div>
        <FloatingLanguageSwitch
          language="km"
          onLanguageChange={() => {}}
        />
        <FloatingMusicPlayer
          musicUrl="https://example.com/audio.mp3"
        />
      </div>
    );
    expect(container).toBeTruthy();
  });

  it("renders InvitationTemplate without throwing", () => {
    const mockEvent: any = {
      title: "សិរីមង្គលអាពាហ៍ពិពាហ៍",
      groom_name: "គុនសុង",
      bride_name: "គីមស៊ីង",
      event_date: "2026-11-16",
      venue: "Garden City",
      template: "essentials-package-01",
      section_visibility: {},
    };

    const { container } = render(
      <InvitationTemplate
        template="essentials-package-01"
        event={mockEvent}
        guestName="ភ្ញៀវកិត្តិយស"
      />
    );
    expect(container).toBeTruthy();
  });
});
