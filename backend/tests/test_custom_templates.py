import pytest
from unittest.mock import MagicMock


def test_create_user_template(mock_db):
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": "tpl-1", "user_id": "user-1", "canvas_width": 800, "canvas_height": 1200,
               "background": {"type": "color", "value": "#fff"}, "elements": []}]
    )

    from custom_templates.service import create_user_template
    from custom_templates.schemas import CreateUserTemplateRequest

    result = create_user_template("user-1", CreateUserTemplateRequest(canvas_width=800, canvas_height=1200))
    assert result["id"] == "tpl-1"


def test_get_user_template_not_found(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )

    from custom_templates.service import get_user_template

    with pytest.raises(ValueError, match="not found"):
        get_user_template("user-1", "missing")


def test_get_user_template_found(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "tpl-1", "user_id": "user-1"}]
    )

    from custom_templates.service import get_user_template

    result = get_user_template("user-1", "tpl-1")
    assert result["id"] == "tpl-1"


def test_update_user_template(mock_db):
    select_chain = mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value
    select_chain.execute.return_value = MagicMock(data=[{"id": "tpl-1", "user_id": "user-1"}])

    update_chain = mock_db.table.return_value.update.return_value.eq.return_value.eq.return_value
    update_chain.execute.return_value = MagicMock(data=[{"id": "tpl-1", "name": "My Design"}])

    from custom_templates.service import update_user_template
    from custom_templates.schemas import UpdateUserTemplateRequest

    result = update_user_template("user-1", "tpl-1", UpdateUserTemplateRequest(name="My Design"))
    assert result["name"] == "My Design"


def test_delete_user_template_not_owned(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )

    from custom_templates.service import delete_user_template

    with pytest.raises(ValueError, match="not found"):
        delete_user_template("user-1", "not-mine")


def test_list_user_templates(mock_db):
    chain = mock_db.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.offset.return_value
    chain.execute.return_value = MagicMock(data=[{"id": "tpl-1"}, {"id": "tpl-2"}])

    from custom_templates.service import list_user_templates

    result = list_user_templates("user-1")
    assert len(result) == 2
