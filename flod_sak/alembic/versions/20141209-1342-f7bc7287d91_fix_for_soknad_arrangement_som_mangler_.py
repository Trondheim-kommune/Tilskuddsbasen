"""fix for soknad_arrangement som mangler FK til arrangement og en PK

Revision ID: f7bc7287d91
Revises: 36b9ad9003f6
Create Date: 2014-12-09 13:42:49.599435

"""

# revision identifiers, used by Alembic.
revision = 'f7bc7287d91'
down_revision = '36b9ad9003f6'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.create_foreign_key(u'soknad_arrangement_arrangement_id_fkey', u'soknad_arrangement', u'arrangement', [u'arrangement_id'], [u'id'])
    op.create_primary_key(u'soknad_arrangement_pkey', u'soknad_arrangement', [u'soknad_id', u'arrangement_id'])


def downgrade():
    op.drop_constraint(u'soknad_arrangement_arrangement_id_fkey', u'soknad_arrangement')
    op.drop_constraint(u'soknad_arrangement_pkey', u'soknad_arrangement')
