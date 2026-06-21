import pytest
from unittest.mock import MagicMock


def _table_router(mock_db, responses):
    """responses: dict of table name -> MagicMock chain result for .execute()"""
    def table_side_effect(name):
        return responses[name]
    mock_db.table.side_effect = table_side_effect


def test_create_evite_customization_no_event(mock_db):
    customizations_chain = MagicMock()
    customizations_chain.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": "cust-1", "template_id": "wed-1", "event_id": None}]
    )
    _table_router(mock_db, {"evite_customizations": customizations_chain})

    from evite_customizations.service import create_evite_customization
    from evite_customizations.schemas import CreateEviteCustomizationRequest

    result = create_evite_customization(
        "user-1", CreateEviteCustomizationRequest(template_id="wed-1")
    )
    assert result["id"] == "cust-1"


def test_create_evite_customization_with_event(mock_db):
    events_chain = MagicMock()
    events_chain.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "event-1"}]
    )
    customizations_chain = MagicMock()
    customizations_chain.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": "cust-1", "template_id": "wed-1", "event_id": "event-1"}]
    )
    _table_router(mock_db, {"events": events_chain, "evite_customizations": customizations_chain})

    from evite_customizations.service import create_evite_customization
    from evite_customizations.schemas import CreateEviteCustomizationRequest

    result = create_evite_customization(
        "user-1", CreateEviteCustomizationRequest(event_id="event-1", template_id="wed-1")
    )
    assert result["event_id"] == "event-1"


def test_create_evite_customization_event_not_owned(mock_db):
    events_chain = MagicMock()
    events_chain.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
    _table_router(mock_db, {"events": events_chain})

    from evite_customizations.service import create_evite_customization
    from evite_customizations.schemas import CreateEviteCustomizationRequest

    with pytest.raises(ValueError, match="Event not found"):
        create_evite_customization(
            "user-1", CreateEviteCustomizationRequest(event_id="not-mine", template_id="wed-1")
        )


def test_get_evite_customization_not_found(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )

    from evite_customizations.service import get_evite_customization

    with pytest.raises(ValueError, match="not found"):
        get_evite_customization("user-1", "missing")


def test_get_evite_customizations_by_event(mock_db):
    events_chain = MagicMock()
    events_chain.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "event-1"}]
    )
    customizations_chain = MagicMock()
    customizations_chain.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(
        data=[{"id": "cust-1", "event_id": "event-1"}]
    )
    _table_router(mock_db, {"events": events_chain, "evite_customizations": customizations_chain})

    from evite_customizations.service import get_evite_customizations_by_event

    result = get_evite_customizations_by_event("user-1", "event-1")
    assert result[0]["id"] == "cust-1"


def test_get_evite_customizations_by_event_not_owned(mock_db):
    events_chain = MagicMock()
    events_chain.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
    _table_router(mock_db, {"events": events_chain})

    from evite_customizations.service import get_evite_customizations_by_event

    with pytest.raises(ValueError, match="Event not found"):
        get_evite_customizations_by_event("user-1", "not-mine")


def test_update_evite_customization(mock_db):
    select_chain = mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value
    select_chain.execute.return_value = MagicMock(data=[{"id": "cust-1", "user_id": "user-1"}])

    update_chain = mock_db.table.return_value.update.return_value.eq.return_value.eq.return_value
    update_chain.execute.return_value = MagicMock(
        data=[{"id": "cust-1", "field_overrides": {"celebrantName": {"color": "#ff0000"}}}]
    )

    from evite_customizations.service import update_evite_customization
    from evite_customizations.schemas import UpdateEviteCustomizationRequest

    result = update_evite_customization(
        "user-1",
        "cust-1",
        UpdateEviteCustomizationRequest(field_overrides={"celebrantName": {"color": "#ff0000"}}),
    )
    assert result["field_overrides"]["celebrantName"]["color"] == "#ff0000"


def test_update_evite_customization_not_owned(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )

    from evite_customizations.service import update_evite_customization
    from evite_customizations.schemas import UpdateEviteCustomizationRequest

    with pytest.raises(ValueError, match="not found"):
        update_evite_customization("user-1", "not-mine", UpdateEviteCustomizationRequest(field_overrides={}))


def test_delete_evite_customization_not_owned(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )

    from evite_customizations.service import delete_evite_customization

    with pytest.raises(ValueError, match="not found"):
        delete_evite_customization("user-1", "not-mine")
