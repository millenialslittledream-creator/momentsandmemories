def test_closed_draft_prompts_once_for_its_owner(fake_db):
    from drafts.service import claim_resume_draft, mark_draft_closed

    draft = {
        "step": 3,
        "event_type": "birthday",
        "form_data": {
            "celebrantName": "Asha",
            "__mmDraft": {"resumePromptOnReturn": False},
        },
        "selected_template": "birthday-template",
        "guests": [],
        "delivery_preference": "link",
    }

    mark_draft_closed("user-1", draft)
    stored = fake_db.STORE["event_drafts"][0]
    assert stored["form_data"]["__mmDraft"]["resumePromptOnReturn"] is True

    claimed = claim_resume_draft("user-1")
    assert claimed["user_id"] == "user-1"
    assert claimed["form_data"]["celebrantName"] == "Asha"
    assert claimed["form_data"]["__mmDraft"]["resumePromptOnReturn"] is False
    assert claim_resume_draft("user-1") is None


def test_closed_draft_cannot_be_claimed_by_another_user(fake_db):
    from drafts.service import claim_resume_draft, mark_draft_closed

    mark_draft_closed("user-1", {"step": 1, "form_data": {"title": "Private draft"}})

    assert claim_resume_draft("user-2") is None
    assert fake_db.STORE["event_drafts"][0]["user_id"] == "user-1"


def test_newer_draft_replaces_old_draft_and_completion_removes_it(fake_db):
    from drafts.service import claim_resume_draft, delete_draft, mark_draft_closed, upsert_draft

    mark_draft_closed("user-1", {"step": 2, "form_data": {"celebrantName": "Old edit"}})
    upsert_draft("user-1", {
        "step": 5,
        "event_type": "marriage",
        "form_data": {"brideName": "Newest", "groomName": "Invitation"},
        "selected_template": "wed-c1",
        "guests": [],
        "delivery_preference": "link",
    })
    mark_draft_closed("user-1")

    claimed = claim_resume_draft("user-1")
    assert claimed["step"] == 5
    assert claimed["form_data"]["brideName"] == "Newest"
    assert "celebrantName" not in claimed["form_data"]

    delete_draft("user-1")
    assert claim_resume_draft("user-1") is None
    assert fake_db.STORE["event_drafts"] == []
